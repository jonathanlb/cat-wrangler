const debug = require('debug')('index');
const express = require('express');
const nodemailer = require('nodemailer');
const Server = require('./server');

const port = process.env.PORT || 3000;
const mailTransport = nodemailer.createTransport(
  {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
  },
);
mailTransport.sendMail = mailTransport.sendMail.bind(mailTransport);

const serverConfig = {
  allowCORS: true,
  email: 'bredin@acm.org',
  mailer: mailTransport.sendMail,
  siteTitle: 'Cat Wranger RSVP',
  siteURL: 'http://192.168.1.4:3000',
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

server.setup().
  then(() => router.listen(port, () => debug('listening on port', port)));
