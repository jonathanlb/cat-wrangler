const debug = require('debug')('Mail');
const nodemailer = require('nodemailer');

module.exports = class Mailer {
  constructor(config) {
    this.from = config.from;
    this.site = config.site;
    this.subject = config.subject || 'Password Reset Request';
    debug('configuring mailer', config.transport);
    this.transport = nodemailer.createTransport(config.transport);

    ['passwordResetMessage', 'sendPasswordReset'].forEach((m) => {
      this[m] = this[m].bind(this);
    });
  }

  passwordResetMessage(userInfo, newPassword) {
    const plaintext =
      `Someone told us that you forgot your password to ${this.site}.\n\n ` +
      `If you really did forget, visit ${this.site} and log in with\n` +
      `\tUser name: ${userInfo.name}\n` +
      `\tPassword: ${newPassword}\n` +
      `You should change your password at ${this.site} under "User Settings" ` +
      'and "Personal" to something more memorable to you or your password manager.\n\n' +
      '\nIf you didn\'t mean to reset your password, you can ignore this message.\n' +
      'Your old password is still valid.';

    const html = `<p>
Someone told us that you forgot your password to 
<a href="${this.site}">${this.site}</a>.
</p>
<p>If you really did forget, visit <a href="${this.site}">${this.site}</a>
and log in with
<dl>
  <dt>User name:</dt><dd>${userInfo.name}</dd>
  <dt>Password:</dt><dd>${newPassword}</dd>
</dl>
</p>
<p>You should change your password at <a href="${this.site}">${this.site}</a>
under "User Settings" -&gt; "Personal" to something more memorable to 
you or your password manager.
</p>
<p>
If you didn't mean to reset your password, you can ignore this message.
Your old password is still valid.
</p>`;

    return {
      to: userInfo.email,
      from: this.from,
      subject: this.subject,
      text: plaintext,
      html,
    };
  }

  async sendPasswordReset(userInfo, newPassword) {
    const data = this.passwordResetMessage(userInfo, newPassword);
    debug('send password request', data);
    return this.transport.sendMail(data);
  }
};
