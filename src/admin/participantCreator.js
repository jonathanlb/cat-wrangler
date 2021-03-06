const debug = require('debug')('participantCreator');
const errors = require('debug')('participantCreator:error');
// eslint-disable-next-line import/no-extraneous-dependencies
const commander = require('commander');
const ServerStub = require('./serverStub');

module.exports = class ParticipantCreator {
  constructor(config) {
    this.server = ServerStub.stubServer(config);
  }

  close() {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
  }

  async createParticipant(userConfig) {
    debug('create', userConfig);
    if (userConfig.id) {
      return this.importParticipant(userConfig);
    }

    const { email, name, password } = userConfig;
    return new Promise((resolve, reject) => {
      this.server.timekeeper.db.serialize(async () => {
        let userId;
        try {
          debug('timekeeper create', name, userConfig);
          userId = await this.server.timekeeper.createParticipant(name, userConfig);
          const authConfig = {
            id: userId.toString(), name, email, password,
          };
          debug('auth create', authConfig);
          await this.server.auth.createUser(authConfig);
          resolve({ id: userId, name, email });
        } catch (e) {
          errors('cannot create participant', e.message);
          if (userId) {
            await this.server.timekeeper.deleteParticipant(userId);
          }
          reject(e);
        }
      });
    });
  }

  async importParticipant(userConfig) {
    debug('import', userConfig);
    const userInfo = await this.server.auth.getUser(userConfig.id);
    if (!userInfo) {
      throw new Error(`Cannot find user ${userConfig.id}`);
    }
    debug('import timekeeper', userInfo);
    const userId = await this.server.timekeeper.createParticipant(userInfo.name, userConfig);
    const tkResult = await this.server.timekeeper.getUserInfo(userId);
    debug('timekeeper found', tkResult);
    return Object.assign(tkResult, userInfo);
  }

  async setup() {
    await this.server.setup({ noNetwork: true });
    return this;
  }

  static parseCLI(argv) {
    const cli = new commander.Command();
    cli.description('Create a new user record').
      option('-n, --name <username>', 'User display name').
      option('-p, --password <secret>', 'Login password').
      option('-e, --email <email>', 'User email').
      option('-i, --id <unique-id>', 'Use id from shared identity DB').
      option('-s, --section <group>', 'Section name').
      option('-o, --organizer', 'Grant organizer priviledges').
      parse(argv);

    const opts = cli.opts();
    debug('CLI', opts);
    if (!opts.id && !(opts.name && opts.password)) {
      throw new Error('Participant Creation requires either id or name and password');
    }
    if (opts.id) {
      opts.name = undefined;
      opts.password = undefined;
      opts.email = undefined;
    }
    return opts;
  }
};
