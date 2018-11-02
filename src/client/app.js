const debug = require('debug')('app');
const errors = require('debug')('app:error');
const yo = require('yo-yo');

const renderHeader = require('./views/header');
const renderLogin = require('./views/login');
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
        const getEventUrl = `${this.serverPrefix}/event/list/` +
            `${this.secret}/${this.userId}/${id}`;
        return fetch(getEventUrl).
          then((eventItem) => {
            this.events[eventItem.id] = eventItem;
            return eventItem;
          }).
          then(eventItem => this.getVenue(eventItem.venue).
            then((venue) => {
              eventItem.venue = venue; // eslint-disable-line
              return eventItem;
            })).
          then(eventItem => Promise.all(
            eventItem.dateTimes.map(
              dt => this.getDateTime(dt),
            ),
          ).
            then((dateTimes) => {
              eventItem.dateTimes = dateTimes; // eslint-disable-line
              return eventItem;
            }));
      })));
  }

  async getVenue(id) {
    const prefetchedVenue = this.venues[id];
    if (prefetchedVenue) {
      return prefetchedVenue;
    }

    const url = `${this.serverPrefix}/venue/get/` +
      `{this.secret}/${this.userId}/${id}`;
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
      default:
        return yo`YO content`;
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

  async setUserNameAndPassword(userName, password) {
    const secret = encodeURIComponent(userName);
    const url = `${this.serverPrefix}/user/bootstrap/` +
      `${encodeURIComponent(password)}/${secret}`;
    return fetch(url).
      then((response) => {
        if (response.status === 200) {
          return response.text();
        }
        errors('setUserNameAndPassword', response);
        throw new Error(`Login failed: ${response.status}`);
      }).
      then((id) => {
        if (id) {
          debug('setUserNameAndPassword', userName, '***', id);
          this.userName = userName;
          this.secret = secret;
          this.userId = parseInt(id, 10);
        }
        return this.render();
      });
  }

  async setup() {
    return this;
  }
};
