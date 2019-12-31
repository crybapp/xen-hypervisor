const fs = require('fs')
const ora = require('ora')
const chalk = require('chalk')
const { exec } = require('child_process')

const { logSplitter } = require('../utils')

module.exports = async (program, _repositoryUrl) => new Promise(async (resolve, reject) => {
	/**
	 * Log the title for this component.
	 */
	logSplitter(`${_repositoryUrl ? 'Cloning' : 'Updating'} ${chalk.cyan('@cryb/portal')}`, {
		newline: !!_repositoryUrl,
		number: _repositoryUrl ? 2 : null
	})

	/**
	 * Determine the command used to update Xen.
	 */
	const type = fs.existsSync('bin/portal') ? 'pull' : 'clone',
			repositoryUrl = _repositoryUrl || 'https://github.com/crybapp/portal.git'
			command = type === 'pull' ? 'cd bin/portal && git pull origin master' : `git clone ${repositoryUrl} bin/portal`
	
	/**
	 * Create a loading animation and tell the user if
	 * Xen is either pulling or cloning @cryb/portal.
	 */
	const loading = ora(type === 'pull' ? `Pulling ${chalk.cyan('@cryb/portal')} from ${chalk.cyan(repositoryUrl)}...` : `Cloning ${chalk.cyan('@cryb/portal')} from ${chalk.cyan(repositoryUrl)}...`).start()

	/**
	 * Execute the command.
	 */
	exec(command, (error, stdout, stderr) => {
		/**
		 * Stop the loading animation once the animation is finished.
		 */
		loading.stop()

		/**
		 * If there is an error, throw it
		 */
		if (error) throw error

		/**
		 * Detect if Git updated @cryb/portal or newly cloned it.
		 * Log the status accordingly.
		 */
		if (stdout.trim() === 'Already up to date.')
			ora(`There were no updates in ${chalk.cyan('@cryb/portal')} - you already have the latest version!`).warn()
		else 
			ora(`${type === 'pull' ? 'Pulled' : 'Cloned'} ${chalk.cyan('@cryb/portal')} from ${chalk.cyan(repositoryUrl)}!`).succeed()

		/**
		 * Resolve.
		 */
		resolve()
	})
})