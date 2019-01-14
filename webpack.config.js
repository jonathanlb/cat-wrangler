const path = require('path');

module.exports = {
	entry: './src/client/index.js',
	module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'public')
	}
};
