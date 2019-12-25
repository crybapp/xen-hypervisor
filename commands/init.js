const fs = require('fs')
const ora = require('ora')
const axios = require('axios')
const inquirer = require('inquirer')

module.exports = async program => new Promise(async (resolve, reject) => {
	if(fs.existsSync('config.json')) {
		const { shouldReinitialiseXen } = await inquirer.prompt([{
			type: 'confirm',
			name: 'shouldReinitialiseXen',
			message: `It looks like Xen has already been initialised. Do you want to reinitialise it?`
		}])
	
		if(!shouldReinitialiseXen) {
			ora('Exiting. If you would like to reinitialise Xen, run \'xen init\' and type \'Y\'').warn()
			process.exit()
		}
	}

	let { atlasEndpoint } = await inquirer.prompt([{
		type: 'list',
		name: 'atlasEndpoint',
		message: 'Which Atlas endpoint do you want to authenticate this Xen instance from?',
		choices: [
			'api.atlas.cryb.app',
			'localhost:6000',
			'Custom'
		]
	}])

	if(atlasEndpoint === 'Custom') {
		const { newAtlasEndpoint } = await inquirer.prompt([{
			type: 'input',
			name: 'newAtlasEndpoint',
			message: 'What is the API URL of the Atlas endpoint?'
		}])

		atlasEndpoint = newAtlasEndpoint
	}

	if(!atlasEndpoint.match(/^[a-zA-Z]+:\/\//))
		atlasEndpoint = `http://${atlasEndpoint}`

	let atlasUrl

	try {
		atlasUrl = new URL(atlasEndpoint)
	} catch(error) {
		return ora('This URL doesn\'t seem valid - try again with a different URL.').fil()
	}

	if(atlasUrl.hostname !== 'localhost')
		atlasUrl = new URL(atlasEndpoint.replace('http://', 'https://'))

	const atlasReachout = ora(`Contacting ${atlasEndpoint}...`).start()
	let instanceUrl, portalRepository

	try {
		const { data: { instance, origin } } = await axios.get(`${atlasUrl.origin}/status`)

		instanceUrl = instance
		portalRepository = origin
	} catch(error) {
		return atlasReachout.fail('We couldn\'t contact this Atlas instance. Please try again later.')
	}

	atlasReachout.succeed(`Contacted ${atlasUrl.origin}!`)

	await require('./update')(program, portalRepository)

	const { authenticationCode } = await inquirer.prompt([{
		type: 'number',
		name: 'authenticationCode',
		message: 'What\'s your Atlas authentication code?',

		validate: input => {
			if(`${input}`.length !== 6) return 'This code is not valid - please try again.'

			return true
		}
	}])

	const verifyingCode = ora('Verifying code...').start()
	let id, token

	try {
		const { data: { id: _id, token: _token } } = await axios.post(`${atlasUrl.origin}/code`, { code: authenticationCode })

		id = _id
		token = _token
	} catch(error) {
		return verifyingCode.fail('This code was incorrect. Please try again later.')
	}

	verifyingCode.succeed(`Recieved token from ${atlasUrl.origin}!`)
	ora(`Successfully setup! Run xen serve to allow this instance to be used on ${instanceUrl}.`).succeed()

	fs.writeFileSync('config.json', JSON.stringify({ id, url: instanceUrl, token }), 'utf8')

	if(program.rawArgs.indexOf('serve') === -1) {
		const { serveXen } = await inquirer.prompt([{
			type: 'confirm',
			name: 'serveXen',
			message: `Would you like to serve Xen for ${instanceUrl}?`
		}])
	
		if(serveXen)
			require('./serve')(program)
		else
			ora('Exiting. If you would like to serve Xen, run \'xen serve\'').warn()
	}

	resolve()
})