const chalk = require('chalk')

module.exports.logSplitter = (title, options) => {
	if(!options)
		options = {
			newline: true
		}

	if(typeof options.newline === 'undefined') options.newline = true

	const line = chalk.gray('---'),
			number = options.number ? ` ${chalk.dim(`${options.number}.`)}` : '',
			newline = options.newline ? '\n' : ''

	console.log(
		title ?
		`${newline}${line}${number} ${chalk.bold(title)} ${line}` :
		`${line}${line}`)
}