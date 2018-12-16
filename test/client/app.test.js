/**
 * @jest-environment jsdom
 */

global.fetch = require('jest-fetch-mock');

const App = require('../../src/client/app');

function setUpDocument() {
  const contentDiv = 'main-app';
  document.body.innerHTML = `\
    <div>\
      <h1>Test Content</h1>\
      <div id="${contentDiv}">\
        uninitialized\
      </div>\
    </div>\
  `;

  return {
    contentDiv,
  };
}

describe('Application framework', () => {
  test('Defaults to login view', () => {
    const app = new App(setUpDocument());
    return app.setup().
      then(() => {
        app.render();

        expect(app.isReady(), 'App initializes without username, etc.').
          toBe(false);
        expect(document.body.innerHTML.includes('Password:'), 'App prompts for password').
          toBe(true);

        app.logout();
        expect(document.body.innerHTML.includes('Password:'), 'App still prompts for password').
          toBe(true);
      });
  });

  test('Fetches datetimes', () => {
    const dt = {
      id: 11,
      yyyymmdd: '2018-12-01',
      hhmm: '14:15',
      duration: '35m',
    };

    global.fetch.mockResponseOnce('19');
    global.fetch.mockResponseOnce(JSON.stringify(dt));

    const app = new App(setUpDocument());
    return app.setup().
      then(() => app.setUserNameAndPassword('Bilbo', 'secret')).
      then(() => app.getDateTime(11)).
      then((result) => {
        expect(result).toEqual(dt);
        expect(app.dateTimes[11]).toEqual(dt);
      }).
      then(() => app.getDateTime(11)).
      then(result => expect(result).toEqual(dt));
  });

  test('Fetches venues', () => {
    const venue = {
      id: 13,
      name: 'Team room',
      address: 'The office',
    };

    global.fetch.mockResponseOnce('19');
    global.fetch.mockResponseOnce(JSON.stringify(venue));

    const app = new App(setUpDocument());
    return app.setup().
      then(() => app.setUserNameAndPassword('Bilbo', 'secret')).
      then(() => app.getVenue(13)).
      then((result) => {
        expect(result).toEqual(venue);
        expect(app.venues[13]).toEqual(venue);
      }).
      then(() => app.getVenue(13)).
      then(result => expect(result).toEqual(venue));
  });

  test('Fetches events', () => {
    const userInfo = {
      name: 'Bilbo',
      id: 19,
      section: 'hobbit',
    };
    const eventIds = [23];
    const dts = [{
      id: 11,
      yyyymmdd: '2018-12-01',
      hhmm: '14:15',
      duration: '35m',
    }, {
      id: 12,
      yyyymmdd: '2018-12-01',
      hhmm: '15:15',
      duration: '10m',
    }];
    const events = [{
      id: 23,
      name: 'Scrum',
      description: '# Hoopla ensues',
      dateTimes: dts,
      venue: 13,
    }];

    const venue = {
      id: 13,
      name: 'Team room',
      address: 'The office',
    };

    global.fetch.mockResponseOnce(JSON.stringify(userInfo));
    global.fetch.mockResponseOnce(JSON.stringify(eventIds));
    global.fetch.mockResponseOnce(JSON.stringify(events[0]));
    global.fetch.mockResponseOnce(JSON.stringify(venue));

    const app = new App(setUpDocument());
    return app.setup().
      then(() => app.setUserNameAndPassword('Bilbo', 'secret')).
      then(() => app.getEvents()).
      then((result) => {
        events[0].dateTimes = dts;
        events[0].venue = venue;
        expect(result).toEqual(events);
      });
  });

  test('Sets user name and password', () => {
    global.fetch.mockResponseOnce('19');

    const app = new App(setUpDocument());
    return app.setup().
      then(() => app.setUserNameAndPassword('Bilbo', 'secret')).
      then(() => expect(app.userName).toEqual('Bilbo')).
      then(() => expect(app.requestOpts.headers['x-access-token']).toEqual('secret')).
      then(() => app.logout()).
      then(() => expect(app.userName).toEqual('')).
      then(() => expect(app.secret).toBeUndefined());
    // TODO mock failure and test....
  });
});
