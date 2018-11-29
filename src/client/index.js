const App = require('./app');

const config = {
  // serverPrefix: 'http://192.168.1.4:3005',
  // title: 'Minnesota Mandolin Orchestra Member Availability'
};
const app = new App(config);
app.setup().
  then(() => app.render());
