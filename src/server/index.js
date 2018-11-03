const express = require('express');
const debug = require('debug')('index');
const Server = require('./server');

const serverConfig = {
  sqliteTimekeeper: {
    file: 'data/mmo.sqlite3',
    // file: 'data/timekeeper.sqlite3',

  },
};
const router = express();
serverConfig.router = router;
router.use(express.static('public'));
const server = new Server(serverConfig);
const port = process.env.PORT || 3000;

server.setup().
  then(() => router.listen(port, () => debug('listening on port', port)));