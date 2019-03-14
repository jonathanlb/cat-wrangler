const debug = require('debug')('index');
const App = require('./app');
const config = require('./config');

debug('configuration', config);
const app = new App(config);
app.setup().
  then(() => app.render());
