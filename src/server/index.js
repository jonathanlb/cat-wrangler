const debug = require('debug')('index');
const errors = require('debug')('index:error');
const express = require('express');
const fs = require('fs');
const https = require('https');
const nodemailer = require('nodemailer');
const serverConfig = require('./config');
const Server = require('./server');

if (!serverConfig.httpPort && !serverConfig.httpsOpts) {
  errors('Must specify server config httpPort or httpsOpts.port (or both)');
  process.exit(1);
}

if (serverConfig.mailConfig) {
  debug('configuring mailer', serverConfig.mailConfig);
  const mailTransport = nodemailer.createTransport(serverConfig.mailConfig);
  mailTransport.sendMail = mailTransport.sendMail.bind(mailTransport);
  serverConfig.mailer = mailTransport.sendMail;
}

const router = express();
serverConfig.router = router;
if (serverConfig.allowCORS) {
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type,Accept,X-Access-Token,X-Key');
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
}
router.use(express.static('public'));
const server = new Server(serverConfig);

server.setup().
  then(() => {
    if (serverConfig.httpsOpts && serverConfig.httpsOpts.port) {
      debug('configuring https', serverConfig.httpsOpts);
      const {
        caFile, certFile, keyFile, port,
      } = serverConfig.httpsOpts;
      const credentials = {
        key: fs.readFileSync(keyFile, 'utf8'),
        certificate: fs.readFileSync(certFile, 'utf8'),
        ca: caFile && fs.readFileSync(caFile, 'utf8'),
      };
      https.createServer(credentials, router).
        listen(port, () => debug('serving https on port', port));
    }

    if (serverConfig.httpPort) {
      router.listen(serverConfig.httpPort, () => debug('serving http port', serverConfig.httpPort));
    }
  });
