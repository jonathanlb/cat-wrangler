const path = require('path');

module.exports = {
	entry: ['babel-polyfill', './src/client/index.js'],
	module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
			{
				test: /\.js$/,
				loader: 'babel-loader',
				query: {
					presets: [['@babel/env', { modules: 'commonjs' }]],
					plugins: ['add-module-exports']
				}
			}
    ],
  },
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'public')
	}
};
