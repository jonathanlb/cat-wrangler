const App = require('./app');

const config = {

};
const app = new App(config);
app.setup().
  then(() => app.render());
