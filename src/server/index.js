const debug = require('debug')('index');
const express = require('express');
const nodemailer = require('nodemailer');
const serverConfig = require('./config');
const Server = require('./server');

const port = process.env.PORT || 3000;

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
  then(() => router.listen(port, () => debug('listening on port', port)));
