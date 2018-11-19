const path = require('path');

module.exports = {
	entry: './src/client/snippets/index.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'public/snippets')
	}
};
