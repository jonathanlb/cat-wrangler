const debug = require('debug')('participantCreator');
const commander = require('commander');
const express = require('express');
const serverOpts = require('../server/config');
const Server = require('../server/server');

module.exports = class ParticipantCreator {
  constructor(config) {
    const authDbFileName =
      (config && config.authDbFileName) || serverOpts.auth.dbFileName;
    const catWranglerDbFileName =
      (config && config.catWranglerDbFileName) || serverOpts.sqliteTimekeeper.file;

    const serverConfig = {
      auth: {
        method: 'simple-auth',
        dbFileName: authDbFileName,
      },
      router: express(),
      sqliteTimekeeper: {
        file: catWranglerDbFileName,
      }
    }

    this.server = new Server(serverConfig);
  }

  close() {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
  }

  async createParticipant() {
  }

  async importParticipant() {
  }

  async setup() {
    await this.server.timekeeper.setup();
    return this;
  }

  static parseCLI(argv) {
    const cli = new commander.Command();
    cli.description('Create a new user record').
      requiredOption('-n, --username <name>', 'User display name').
      requiredOption('-p, --password <secret>', 'Login password').
      requiredOption('-e, --email <email>', 'User email').
      option('-i, --id <unique-id>', 'Use id from shared identity DB').
      option('-s, --section <group>', 'Section name').
      option('-o, --organizer', 'Grant organizer priviledges').
      parse(argv);
    return cli.opts();
  }
};
