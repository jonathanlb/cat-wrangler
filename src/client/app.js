const debug = require('debug')('app');
const errors = require('debug')('app:error');
const yo = require('yo-yo');

const renderAboutApp = require('./views/about');
const renderBrowseEvents = require('./views/browseEvents');
const renderEventDetails = require('./views/detailEvent');
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
    this.loginInstructions = config.loginInstructions || '';
    this.requestOpts = {
      cache: 'no-cache',
      headers: { },
    };
    if (localStorage.session) {
      this.requestOpts.headers['x-access-token'] = localStorage.session;
    }
    this.selectedEvent = undefined;
    this.serverPrefix = config.serverPrefix || '';
    this.title = config.title || 'Cat Wrangler';
    this.userId = localStorage.userId || -1;
    this.userInfo = {};
    this.userName = localStorage.userName || undefined;
    this.userInfo = {};
    this.venues = {};
    this.organizerUser = localStorage.organizer &&
      localStorage.organizer === 'true';

    // this.rsvp = this.rsvp.bind(this);
    const methodsToBind = ['getNevers', 'getUserInfo', 'logout'];
    methodsToBind.forEach((m) => { this[m] = this[m].bind(this); });
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

    const url = `${this.serverPrefix}/datetime/get/${this.userId}/${id}`;
    debug('getDateTime', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status === 200) {
      this.setSession(response);
      const dt = await response.json();
      this.dateTimes[dt.id] = dt;
      return dt;
    }
    errors('getDateTime', response.status);
    this.handleViewUponError(response);
    throw new Error(`cannot lookup datetime ${id}: ${response.status}`);
  }

  async getEvents(query) {
    if (query) {
      errors('getEvents with query not implemented', query);
    }

    const url = `${`${this.serverPrefix}/event/list/` +
      `${this.userId}`}${query ? '/TODO' : ''}`;
    debug('getEvents', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status !== 200) {
      errors('getEvents', response);
      this.handleViewUponError(response);
      throw new Error(`getEvents "${query || ''}" failed: ${response.status}`);
    }

    this.setSession(response);
    const eventIds = await response.json();
    return Promise.all(eventIds.map(async (id) => {
      debug('getEvent id:', id);
      const getEventUrl = `${this.serverPrefix}/event/get/` +
        `${this.userId}/${id}`;
      debug('getEventUrl', getEventUrl);
      const eventItemResponse = await fetch(getEventUrl, this.requestOpts);
      const eventItem = await eventItemResponse.json();
      debug('getEvent:', eventItem);
      this.events[eventItem.id] = eventItem;
      const venue = await this.getVenue(eventItem.venue);
      eventItem.venue = venue; // eslint-disable-line
      return eventItem;
    }));
  }

  async getEventDetails(eventId) {
    const url = `${this.serverPrefix}/event/detail/${this.userId}/${eventId}`;
    debug('getEventDetails', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status !== 200) {
      this.handleViewUponError(response);
      throw new Error(`cannot fetch event rsvps ${response.status}`);
    }
    this.setSession(response);
    return response.json();
  }

  async getNevers() {
    const url = `${this.serverPrefix}/event/nevers/${this.userId}`;
    debug('getNevers', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status !== 200) {
      this.handleViewUponError(response);
      throw new Error(`cannot fetch never attend dates ${response.status}`);
    }
    this.setSession(response);
    return response.json();
  }

  async getRsvpSummary(eventId) {
    const url = `${this.serverPrefix}/event/summary/${this.userId}/${eventId}`;
    debug('getRsvpSummary', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status === 200) {
      this.setSession(response);
      return response.json();
    }
    errors('getRsvpSummary', response.status);
    this.handleViewUponError(response);
    throw new Error(`cannot lookup event ${eventId} rsvp summary: ${response.status}`);
  }

  async getUserInfo(id) {
    let result = this.userInfo[id];
    if (result) {
      return result;
    }

    const url = `${this.serverPrefix}/user/get/${this.userId}/${id}`;
    debug('getUserInfo', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status === 200) {
      this.setSession(response);
      result = await response.json();
      this.userInfo[id] = result;
      debug('getUserInfo', result);
      return result;
    }
    this.handleViewUponError(response);
    errors('getUserInfo', response.status);
    throw new Error(`cannot lookup user ${id}: ${response.status}`);
  }

  async getVenue(id) {
    const prefetchedVenue = this.venues[id];
    if (prefetchedVenue) {
      return prefetchedVenue;
    }

    const url = `${this.serverPrefix}/venue/get/${this.userId}/${id}`;
    debug('getVenue', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status === 200) {
      this.setSession(response);
      const venue = await response.json();
      this.venues[venue.id] = venue;
      return venue;
    }
    this.handleViewUponError(response);
    errors('getVenue', response.status);
    throw new Error(`cannot lookup venue ${id}: ${response.status}`);
  }

  getView(opts) {
    switch ((opts && opts.view) || Views.DEFAULT_VIEW) {
      case Views.BROWSE_EVENTS:
        return renderBrowseEvents(this);
      case Views.USER_SETTINGS:
        return renderUserSettings(this);
      case Views.ABOUT_APP:
        return renderAboutApp(this);
      case Views.UPDATE_PASSWORD:
        return renderUpdatePassword(this);
      case Views.EVENT_DETAILS:
        return renderEventDetails(this, opts);
      default:
        errors('unknown view', opts);
        return '';
    }
  }

  handleViewUponError(response) {
    if (response === 404) {
      // eslint-disable-line no-empty
    } else if (response.status >= 400 && response.status < 500) {
      this.render({ view: Views.LOGIN });
    }
    // TODO, alert of 500 errors
  }

  logout() {
    this.userId = undefined;
    this.userName = '';
    delete localStorage.userName;
    delete localStorage.userId;
    delete this.requestOpts.headers['x-access-token'];
    delete localStorage.session;
    this.render();
  }

  isReady() {
    debug('isReady', this.userId, this.userName);
    return this.userId > 0 && this.userName !== undefined;
  }

  /**
   * Send the server a new date we cannot attend.
   * @param dateStr a string in the form yyyy-mm-dd.
   */
  async postNevers(dateStr) {
    // handle formatting of dateStr if client requires it.
    // Oddly, Chome datepicker formats to yyyy-mm-dd.
    const url = `${this.serverPrefix}/event/never/${this.userId}/${dateStr}`;
    debug('postNevers', url);
    return fetch(url, this.requestOpts);
  }

  render(opts) {
    debug('render', opts);

    let innerHTML;
    if (!this.isReady() || (opts && opts.view === Views.LOGIN)) {
      innerHTML = yo`
        <div id="${this.contentDiv}">
          ${renderLogin(this)}
        </div>`;
    } else {
      innerHTML = yo`
      <div id="${this.contentDiv}">
        ${renderHeader(this)}
        <main>
          ${this.getView(opts)}
        </main>
      </div>
    `;
    }

    const elt = document.getElementById(this.contentDiv);
    yo.update(elt, innerHTML);
  }

  async resetPassword(userName) {
    const url = `${this.serverPrefix}/password/reset/${userName}`;
    const response = await fetch(url, { cache: 'no-cache' });
    if (response.status !== 200) {
      errors('resetPassword', response);
      this.handleViewUponError(response);
    }
  }

  async rsvp(dt, value) {
    const url = `${this.serverPrefix}/event/rsvp/` +
      `${this.userId}/${dt.event}/${dt.id}/${value}`;
    debug('rsvp', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status !== 200) {
      errors('rsvp', response);
      this.handleViewUponError(response);
    }
    this.setSession(response);
  }

  setSession(response) {
    const session = response.headers.get('x-access-token');
    if (session && session.length) {
      debug('overwriting password with or updating session key');
      this.requestOpts.headers['x-access-token'] = session;
      localStorage.session = session;
    }
  }

  async setUserNameAndPassword(userName, password) {
    const secret = encodeURIComponent(password);
    const url = `${this.serverPrefix}/user/bootstrap/${
      encodeURIComponent(userName)}`;
    this.requestOpts.headers['x-access-token'] = secret;
    debug('setUserNameAndPassword', url);
    const response = await fetch(url, this.requestOpts);

    if (response.status !== 200) {
      delete this.requestOpts.headers['x-access-token'];
      errors('setUserNameAndPassword', response);
      throw new Error(`Login failed: ${response.status}`);
    }
    this.setSession(response);
    const userInfo = await response.json();
    debug('setUserNameAndPassword', userName, userInfo);
    this.organizerUser = (userInfo.organizer || false) && true;
    localStorage.organizer = this.organizerUser;
    this.email = userInfo.email;
    this.userName = userName;
    localStorage.userName = userName;
    this.userId = userInfo.id;
    localStorage.userId = userInfo.id;
    this.userSection = userInfo.section;
    return this.render();
  }

  async setup() {
    if (this.requestOpts.headers['x-access-token']) {
      return this.getEvents();
    }
    return this;
  }

  async updatePassword(newPassword) {
    const secret = encodeURIComponent(newPassword);
    const url = `${this.serverPrefix}/password/change/${this.userId}/${secret}`;
    const response = await fetch(url, this.requestOpts);
    if (response.status === 200) {
      this.requestOpts.headers['x-access-token'] = secret;
      this.setSession(response); // possible overwrite
    } else {
      this.handleViewUponError(response);
      throw new Error(`Cannot change password: ${response.status}`);
    }
  }

  async updateSection(proposedSection) {
    const url = `${this.serverPrefix}/user/update-section/` +
      `${this.userId}/${proposedSection}`;
    debug('updateSection', url);
    const response = await fetch(url, this.requestOpts);
    if (response.status !== 200) {
      errors('updateSection', response);
      this.handleViewUponError(response);
      throw new Error(`Update section failed: ${response.status}`);
    } else {
      this.setSession(response);
      const responseSection = await response.text();
      this.userSection = responseSection;
    }
    return this.userSection;
  }
};
