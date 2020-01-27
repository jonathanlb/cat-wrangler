const Mailer = require('../../src/server/mail');

describe('Mailer integration', () => {
  test('Creates a password reset message', () => {
    const mailerConfig = {
      from: 'unit-test@some.site.org',
      site: 'https://some.site.org',
      subject: 'RESET PASSWORD',
      transport: {

      },
    };

    const mail = new Mailer(mailerConfig);
    const f = mail.passwordResetMessage;

    const userInfo = {
      name: 'SOMEONE',
      email: 'volunteer@some.site.org',
    };
    const newPassword = 'asdf';

    const msg = f(userInfo, newPassword);
    expect(msg.to).toEqual(userInfo.email);
    expect(msg.from).toEqual(mailerConfig.from);
    expect(msg.subject).toEqual(mailerConfig.subject);
    expect(msg.text).toEqual(expect.stringContaining(newPassword));
    expect(msg.html).toEqual(expect.stringContaining(newPassword));
  });
});
