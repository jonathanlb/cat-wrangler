const debug = require('debug')('index');
const App = require('./app');
const config = require('./config');

debug('configuration', config);
const app = new App(config);
app.render(); // obliterate the Javascipt-requirement message
app.setup().
  then(() => app.render());
