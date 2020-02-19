const debug = require('debug')('passwordManager');
// eslint-disable-next-line import/no-extraneous-dependencies
const commander = require('commander');
const ServerStub = require('./serverStub');

module.exports = class PasswordManager {
  constructor(config) {
    this.server = ServerStub.stubServer(config);
  }

  close() {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
  }

  async managePassword(userConfig) {
    const { password, recovery } = userConfig;
    if (password) {
      return this.server.auth.setPassword(userConfig, password);
    } if (recovery) {
      const newPassword = await this.server.auth.resetPassword(
        userConfig, recovery,
      );
      if (recovery !== newPassword) {
        throw new Error(`Cannot reset password for ${userConfig}`);
      }
			return recovery;
    } else {
      throw new Error(
        'Password manager requires either new or recovery password.',
      );
    }
  }

  async setup() {
    await this.server.setup({ noNetwork: true });
    this.server.auth.deliverPasswordResetDefined = true;
    this.server.auth.deliverPasswordReset = () => true;
    return this;
  }

  static parseCLI(argv) {
    const cli = new commander.Command();
    cli.description('Manage user passwords').
      option('-n, --name <username>', 'User display name').
      option('-p, --password <secret>', 'Login password').
      option('-e, --email <email>', 'User email').
      option('-r, --recovery <secret>', 'Recovery password, does not disturb password.').
      option('-i, --id <unique-id>', 'Use id from shared identity DB').
      parse(argv);

    const opts = cli.opts();
    debug('CLI', opts);
    if (typeof opts.name === 'function') {
      opts.name = undefined;
    }
    if (!opts.email && !opts.id && !opts.name) {
      throw new Error('Password manager requires either id, name, or email.');
    }
    if (!opts.password && !opts.recovery) {
      throw new Error(
        'Password manager requires either new or recovery password.',
      );
    }
    return opts;
  }
};
