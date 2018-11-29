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

### Create an Event

### Create Participants

Afterwards, users can log into the Cat Wrangler website with their user name
and password, select an event, and RSVP to the time options.

** TODO ** render detailed responses to admin users.
** TODO ** use https on server side.

## Troubleshooting

### Sqlite Installation
By default, cat-wrangler uses Sqlite for persistence via the [sqlite3](https://www.npmjs.com/package/sqlite3) interface module, which can be tricky to install.

- **node-gyp fails with a python stack:** Check your default python installation with `python --version`.  If that shows python 3.x, then specify a python 2.7 during installation: `npm install --python=<your-path-to-python2.7>`
