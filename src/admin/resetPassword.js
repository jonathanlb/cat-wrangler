// Usage: DEBUG='*' node src/admin/resetPassword.js
const PasswordManager = require('./passwordManager');

const config = PasswordManager.parseCLI(process.argv);
const pm = new PasswordManager(config);

pm.setup().
  then(() => pm.updatePassword(config)).
  then(() => pm.close());
