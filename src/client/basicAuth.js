const debug = require('debug')('basicAuth');

/**
 * Provide functionality for basic authentication to external websites.
 * This module only functions when cat-wrangler is configured to use https.
 */
module.exports = (app) => {
  const { platform, userAgent } = window.navigator || { };

  /**
   * From KevinB https://stackoverflow.com/questions/2914/how-can-i-detect-if-a-browser-is-blocking-a-popup
   */
  function checkWindowOpen(popupWindow, url) {
    const handleError = () => {
      // eslint-disable-next-line no-alert
      window.alert(`Please add this site to your popup blocker exception list.\nURL=${url}`);
      window.location.href = url;
    };

    const isPopUpBlocked = (popup) => {
      if (!popup || !popup.innerHeight) {
        debug('popup blocked');
        handleError();
      } else {
        debug('popup OK');
      }
    };

    debug('check popup', popupWindow);
    if (popupWindow) {
      if (/chrome/.test(userAgent.toLowerCase())) {
        setTimeout(() => isPopUpBlocked(popupWindow), 200);
      } else {
        // eslint-disable-next-line no-param-reassign
        popupWindow.onload = () => isPopUpBlocked(popupWindow);
      }
    } else {
      debug('popup open failure');
      handleError();
    }
  }

  /**
   * Retrieve the username:password value stored at cat-wrangler under key.
   */
  async function getBasicAuth(key) {
    const keyServerUrl = `${app.serverPrefix}/key/${app.userId}/${key}`;
    if (!keyServerUrl.startsWith('https://')) {
      // eslint-disable-next-line no-throw-literal
      throw `Authentication URL '${keyServerUrl}' must begin with https:// .`;
    }
    const response = await fetch(keyServerUrl, app.requestOpts);
    if (response.status !== 200) {
      // eslint-disable-next-line no-throw-literal
      throw `Cannot authenticate ${key}`;
    }
    const value = await response.text();
    return value.split(':');
  }

  /**
   * Open content in another window.  The browser will likely save the user
   * name and password -- at least Chrome 75 does -- allowing the user to
   * browse content outside of the webapp.
   *
   * TODO: consider adding error handler hook.  Currently on error, we just
   * alert the user.
   *
   * @param key a name for a hint at the cat-wrangler server to lookup the url.
   * @param url the url, minus https:// and user name used to access the content.
   */
  async function openContent(key, url) {
    try {
      const [username, password] = await getBasicAuth(key);
      const isIOS = !!platform.match(/iPhone|iPod|iPad/i);
      const isMicrosoft = !!userAgent.match(/Edge/);
      const isSafari = !!userAgent.match(/AppleWebKit/i) &&
        !userAgent.match(/CriOS/i);
      let authUrl;

      // eslint-disable-next-line no-alert
      const warn = () => window.alert(
        'Opening content not available in this browser.  ' +
        'Please use Chrome or Firefox.\n\n' +
        `For now use username: ${username} and password: ${password}`,
      );

      debug('openContent', key, url, 'platform=', platform, 'agent=', userAgent);
      if (isMicrosoft) {
        authUrl = `https://${url}`;
        warn();
      } else if (isIOS && isSafari) {
        authUrl = `https://${username}:${password}@${url}`;
        warn();
      } else {
        authUrl = `https://${username}:${password}@${url}`;
      }

      const popup = window.open(authUrl, '_blank');
      checkWindowOpen(popup, authUrl);
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      window.alert('Cannot authenticate with content server.'); // eslint-disable-line no-alert
    }
  }

  return {
    checkWindowOpen,
    openContent,
  };
};
