const fs = require('fs')
const ora = require('ora')
const { exec } = require('child_process')

module.exports = async (program, repositoryUrl) => new Promise(async (resolve, reject) => {
	const type = fs.existsSync('bin/portal') ? 'pull' : 'clone',
			command = type === 'pull' ? 'cd bin/portal && git pull origin master' : `git clone ${repositoryUrl || 'https://github.com/crybapp/portal.git'} bin/portal`
	
	const loading = ora(type === 'pull' ? 'Pulling @cryb/portal from GitHub...' : 'Cloning @cryb/portal from GitHub...').start()

	exec(command, (error, stdout, stderr) => {
		loading.stop()

		if(error) throw error

		if(stdout.trim() === 'Already up to date.')
			ora('There were no updates in @cryb/portal - you already have the latest version!').warn()
		else 
			ora(`${type === 'pull' ? 'Pulled' : 'Cloned'} @cryb/portal from GitHub!`).succeed()

		resolve()
	})
})