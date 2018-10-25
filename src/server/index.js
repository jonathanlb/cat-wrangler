const express = require('express');
const debug = require('debug')('index');
const Server = require('./server');

const serverConfig = {
  sqliteTimekeeper: {
    file: 'data/timekeeper.sqlite3',
  },
};

const router = express();
const server = new Server();
const port = process.env.PORT || 3000;

server.setup().
  then(() => router.listen(port, () => debug('listening on port', port)));
