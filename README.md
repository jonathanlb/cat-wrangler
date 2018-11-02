# cat-wrangler
Time-management platform

## Installation
```sh
git clone https://github.com/jonathanlb/cat-wrangler
cd cat-wrangler
npm install
npm run build
DEBUG='*' PORT=3003 npm run start
# point your browser to http://localhost:3003/index.html
```

Event and user creation is not available from the web.  Use the tools in [src/admin](src/admin) to create events and users.

### Troubleshooting
By default, cat-wrangler uses Sqlite for persistence via the [sqlite3](https://www.npmjs.com/package/sqlite3) interface module, which can be tricky to install. 

- **node-gyp fails with a python stack:** Check your default python installation with `python --version`.  If that shows python 3.x, then specify a python 2.7 during installation: `npm install --python=<your-path-to-python2.7>`

## TODOs
### Server
- Create event, venue, user using script.

### Client
