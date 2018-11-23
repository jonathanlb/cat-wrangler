const express = require('express');
const debug = require('debug')('index');
const Server = require('./server');

const serverConfig = {
  allowCORS: true,
  sqliteTimekeeper: {
    file: 'data/mmo.sqlite3',
    // file: 'data/timekeeper.sqlite3',
  },
};
const router = express();
serverConfig.router = router;
if (serverConfig.allowCORS) {
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
  });
}
router.use(express.static('public'));
const server = new Server(serverConfig);
const port = process.env.PORT || 3000;

server.setup().
  then(() => router.listen(port, () => debug('listening on port', port)));
