const debug = require('debug')('app');
const errors = require('debug')('app:error');
const yo = require('yo-yo');

const renderAboutApp = require('./views/about');
const renderBrowseEvents = require('./views/browseEvents');
const renderHeader = require('./views/header');
const renderLogin = require('./views/login');
const renderUpdatePassword = require('./views/updatePassword');
const renderUserSettings = require('./views/userSettings');
const Views = require('./views');

module.exports = class App {
  /**
   * @param config
   *  - contentDiv id of div into which to render.
   */
  constructor(config) {
    this.contentDiv = config.contentDiv || 'main-app';
    this.dateTimes = {};
    this.events = {};
    this.secret = undefined;
    this.selectedEvent = undefined;
    this.serverPrefix = config.serverPrefix || '';
    this.userId = -1;
    this.userName = undefined;
    this.venues = {};

    // this.rsvp = this.rsvp.bind(this);
  }

  /**
   * This function is almost identical to getVenue.  Generalize to get
   * JSON object and cache?
   */
  async getDateTime(id) {
    const prefetchedDateTime = this.dateTimes[id];
    if (prefetchedDateTime) {
      return prefetchedDateTime;
    }

    const url = `${this.serverPrefix}/datetime/get/` +
      `{this.secret}/${this.userId}/${id}`;
    return fetch(url).
      then((response) => {
        if (response.status === 200) {
          return response.json().
            then((dt) => {
              this.dateTimes[dt.id] = dt;
              return dt;
            });
        }
        errors('getDateTime', response.status);
        throw new Error(`cannot lookup datetime ${id}: ${response.status}`);
      });
  }

  async getEvents(query) {
    if (query) {
      errors('getEvents with query not implemented', query);
    }

    const url = `${`${this.serverPrefix}/event/list/` +
      `${this.secret}/${this.userId}`}${
      query ? '/TODO' : ''}`;
    return fetch(url).
      then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        errors('getEvents', response);
        throw new Error(`getEvents "${query}" failed: ${response.status}`);
      }).
      then(eventIds => Promise.all(eventIds.map((id) => {
        debug('getEvent id:', id);
        const getEventUrl = `${this.serverPrefix}/event/get/` +
            `${this.secret}/${this.userId}/${id}`;
        return fetch(getEventUrl).
          then(eventItemResponse => eventItemResponse.json()).
          then((eventItem) => {
            debug('getEvent:', eventItem);
            this.events[eventItem.id] = eventItem;
            return eventItem;
          }).
          then(eventItem => this.getVenue(eventItem.venue).
            then((venue) => {
              eventItem.venue = venue; // eslint-disable-line
              return eventItem;
            }));
      })));
  }

  async getNevers() {
    const url = `${this.serverPrefix}/event/nevers/${this.secret}/${this.userId}`;
    debug('getNevers');
    const response = await fetch(url);
    if (response.status !== 200) {
      throw new Error(`cannot fetch never attend dates ${response.status}`);
    }
    return response.json();
  }

  async getRsvpSummary(eventId) {
    const url = `${this.serverPrefix}/event/summary/` +
      `${this.secret}/${this.userId}/${eventId}`;
    return fetch(url).
      then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        errors('getRsvpSummary', response.status);
        throw new Error(`cannot lookup event ${eventId} rsvp summary: ${response.status}`);
      });
  }

  async getVenue(id) {
    const prefetchedVenue = this.venues[id];
    if (prefetchedVenue) {
      return prefetchedVenue;
    }

    const url = `${this.serverPrefix}/venue/get/` +
      `${this.secret}/${this.userId}/${id}`;
    return fetch(url).
      then((response) => {
        if (response.status === 200) {
          return response.json().
            then((venue) => {
              this.venues[venue.id] = venue;
              return venue;
            });
        }
        errors('getVenue', response.status);
        throw new Error(`cannot lookup venue ${id}: ${response.status}`);
      });
  }

  getView(opts) {
    if (!this.isReady()) {
      return renderLogin(this);
    }
    switch ((opts && opts.view) || Views.DEFAULT) {
      case Views.BROWSE_EVENTS:
        return renderBrowseEvents(this);
      case Views.USER_SETTINGS:
        return renderUserSettings(this);
      case Views.ABOUT_APP:
        return renderAboutApp(this);
      case Views.UPDATE_PASSWORD:
        return renderUpdatePassword(this);
      default:
        errors('unknown view', opts && opts.view);
        return '';
    }
  }

  logout() {
    this.userId = undefined;
    this.userName = '';
    this.secret = undefined;
    this.render();
  }

  isReady() {
    return this.userId > 0 && this.userName !== undefined;
  }

  async postNevers(dateStr) {
    const url = `${this.serverPrefix}/event/never/${this.secret}/${this.userId}/${dateStr}`;
    debug('postNevers', dateStr);
    return fetch(url);
  }

  render(opts) {
    debug('render', opts);

    const innerHTML = yo`
      <div id="${this.contentDiv}">
        ${renderHeader(this)}
        <main>
          ${this.getView(opts)}
        </main>
      </div>
    `;

    const elt = document.getElementById(this.contentDiv);
    yo.update(elt, innerHTML);
  }

  async rsvp(dt, value) {
    const url = `${this.serverPrefix}/event/rsvp/` +
      `${this.secret}/${this.userId}/${dt.event}/${dt.id}/${value}`;
    return fetch(url).
      then((response) => {
        if (response.status !== 200) {
          errors('rsvp', response);
        }
      });
  }

  async setUserNameAndPassword(userName, password) {
    const secret = encodeURIComponent(password);
    const url = `${this.serverPrefix}/user/bootstrap/` +
      `${secret}/${encodeURIComponent(userName)}`;
    const response = await fetch(url);
    if (response.status !== 200) {
      errors('setUserNameAndPassword', response);
      throw new Error(`Login failed: ${response.status}`);
    }
    const text = await response.text();
    if (text) {
      const userInfo = JSON.parse(text);
      debug('setUserNameAndPassword', userName, '***', userInfo.id);
      this.userName = userName;
      this.secret = secret;
      this.userId = userInfo.id;
      this.userSection = userInfo.section;
    }
    return this.render();
  }

  async setup() {
    return this;
  }

  async updatePassword(newPassword) {
    const secret = encodeURIComponent(newPassword);
    const url = `${this.serverPrefix}/password/change/${this.secret}/${this.userId}/${secret}`;
    const response = await fetch(url);
    if (response.status === 200) {
      this.secret = secret;
    } else {
      throw new Error(`Cannot change password: ${response.status}`);
    }
  }

  async updateSection(proposedSection) {
    const url = `${this.serverPrefix}/user/update-section/${this.secret}/${this.userId}/${proposedSection}`;
    const response = await fetch(url);
    if (response.status !== 200) {
      errors('updateSection', response);
      throw new Error(`Update section failed: ${response.status}`);
    } else {
      const responseSection = await response.text();
      this.userSection = responseSection;
    }
    return this.userSection;
  }
};
