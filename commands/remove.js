const fs = require('fs')

/**
 * This file is still in development.
 */
module.exports = async program => {
	if (fs.existsSync('./bin'))
		fs.unlinkSync('./bin')
	
	if (fs.existsSync('./config.json'))
		fs.unlinkSync('config.json')
}