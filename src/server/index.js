const debug = require('debug')('index');
const errors = require('debug')('index:error');
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const https = require('https');
const tls = require('tls');
const serverConfig = require('./config');
const Server = require('./server');

if (!serverConfig.httpPort && !serverConfig.httpsOpts) {
  errors('Must specify server config httpPort or httpsOpts.port (or both)');
  process.exit(1);
}

const router = express();
serverConfig.router = router;
debug('CORS', serverConfig.allowCORS);
if (serverConfig.allowCORS) {
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type,Accept,X-Access-Token,X-Key');
    res.header('Access-Control-Expose-Headers', 'X-Access-Token');
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
}
router.use(express.static('public'));
const server = new Server(serverConfig);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
});
router.use(limiter);

server.setup().
  then(() => {
    debug('config https', serverConfig.httpsOpts);
    if (serverConfig.httpsOpts && serverConfig.httpsOpts.port) {
      const {
        caFile, certFile, keyFile, port,
      } = serverConfig.httpsOpts;
      // create TLS context on demand
      // https://github.com/nodejs/node/issues/15115
      https.createServer({
        SNICallback: (servername, cb) => {
          debug('creating secure context...');
          const ctx = tls.createSecureContext({
            key: fs.readFileSync(keyFile, 'utf8'),
            cert: fs.readFileSync(certFile, 'utf8'),
            ca: caFile && fs.readFileSync(caFile, 'utf8'),
          });
          cb(null, ctx);
        },
      },
      router).
        listen(port, () => debug('serving https on port', port));
    }

    if (serverConfig.httpPort) {
      router.listen(serverConfig.httpPort, () => debug('serving http port', serverConfig.httpPort));
    }
  });
