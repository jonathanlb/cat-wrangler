/**
 * Provide functionality for basic authentication to external websites.
 * This module only functions when cat-wrangler is configured to use https.
 */
module.exports = (app) => {
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
      const authUrl = `https://${username}:${password}@${url}`;
      window.open(authUrl);
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
      window.alert('Cannot authenticate with content server.'); // eslint-disable-line no-alert
    }
  }

  return {
    openContent,
  };
};
