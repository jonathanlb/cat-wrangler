const debug = require('debug')('serverStub');
const express = require('express');
const serverOpts = require('../server/config');
const Server = require('../server/server');

module.exports = {
  stubServer: (config) => {
    const authDbFileName =
      (config && config.authDbFileName) ||
      serverOpts.auth.dbFileName;
    const privateKeyFileName =
      (config && config.privateKeyFileName) ||
      serverOpts.auth.privateKeyFileName;
    const publicKeyFileName =
      (config && config.publicKeyFileName) ||
      serverOpts.auth.publicKeyFileName;
    const catWranglerDbFileName =
      (config && config.catWranglerDbFileName) ||
      serverOpts.sqliteTimekeeper.file;

    const serverConfig = {
      auth: {
        method: 'simple-auth',
        dbFileName: authDbFileName,
        privateKeyFileName,
        publicKeyFileName,
      },
      sqliteTimekeeper: {
        file: catWranglerDbFileName,
      },
    };
    debug('new', serverConfig);
    serverConfig.router = express();
    return new Server(serverConfig);
  },
};
