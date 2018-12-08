# cat-wrangler
Cat Wrangler presents a web-based interface to a database collecting
users' availability for time options.
Individual user responses are not published, except to authenticated event
managers, but Cat Wrangler presents aggregate availability to individuals.

## Installation
```sh
git clone https://github.com/jonathanlb/cat-wrangler
cd cat-wrangler
npm install
npm run build
DEBUG='*' PORT=3003 npm run start
# point your browser to http://localhost:3003/index.html
```

You can run the client-facing webserver and the nodejs back-end on separate
hosts.
Just edit the config object in [src/client/index.js](src/client/index.js) to
include a `serverPrefix` field with the route to your host,
e.g. `http://192.168.4:3005`, run `npm run build`, and copy the contents of
the [public](public) directory under your webserver.

## Event Configuration
Event and user creation is not available from the web.
Use the tools in [src/admin](src/admin) to create events and users.

### Create a Venue
```bash
DEBUG='*' node src/admin/createVenue.js data/mmo.sqlite3 'Emerald Palace' '1 Yellow Brick Rd, Emerald City, OZ, 98765'
```

### Create an Event
Create a event config json file of the form

```json
{
   "name": "Extravaganza",
   "venue": {
     "name": "The Dive",
     "address": "37 Lake St"
     /* alternatively, you can specify the venue id e.g. "id": 37 */
   },
   "description": "# Best Test Event Evuh\nRSVP or ....",
   "dates": [
     { "yyyymmdd": "2018-12-01", "hhmm": "8:39", "duration": "45m" },
     { "yyyymmdd": "2018-12-01", "hhmm": "9:06", "duration": "45m" }
   ]
}
```

Then run:

```bash
DEBUG='*' node src/admin/createEvent.js event.config.json data/mmo.sqlite3
```

### Create Participants
Be sure to quote user names, passwords, emails, and any arguments with a space.

```bash
DEBUG='*' node src/admin/createParticipant.js data/mmo.sqlite3 'Spectacular Solist' 'shh password' 'email@xxx.org' false 'Contra Zither'
```

Afterwards, users can log into the Cat Wrangler website with their user name and password, select an event, and RSVP to the time options.

## Troubleshooting

### Bcrypt Fails at Runtime
[bcrypt](https://github.com/kelektiv/node.bcrypt.js/) doesn't always install cleanly.  The precompiled module might [fail with a symbol lookup error.](https://github.com/kelektiv/node.bcrypt.js/issues/656)  Fix the module with:

```
npm rebuild bcrypt --build-from-source
```

### Sqlite Installation
By default, Cat Wrangler uses Sqlite for persistence via the [sqlite3](https://www.npmjs.com/package/sqlite3) interface module, which can be tricky to install.

- **node-gyp fails with a python stack:** Check your default python installation with `python --version`.  If that shows python 3.x, then specify a python 2.7 during installation: `npm install --python=<your-path-to-python2.7>`
- **install fails at 'node-pre-gyp install --fallback-to-build':** The npm-sqlite build environment is sensitive to the version of NPM.  As of December 2018, using [nvm, the node version manager](https://github.com/creationix/nvm) to pin node to version 8.9.3 will enable a successful launch of the build.

## TODO
- Use https.
- Render detailed rsvp responses for event administrators.
- Summarize never/blackout dates.
- Add cancel/undo blackout date.
- Implement tool to close out/decide event dates