const fs = require('fs')
const ora = require('ora')
const chalk = require('chalk')
const axios = require('axios')
const inquirer = require('inquirer')

const { logSplitter } = require('../utils')

module.exports = async program => new Promise(async (resolve, reject) => {
	/**
	 * Check if config.json exists
	 */
	if(fs.existsSync('config.json')) {
		/**
		 * If it does, warn the user that reinitialising Xen
		 * will override any previous configurations and allow
		 * them to cancel if need be.
		 */
		const { shouldReinitialiseXen } = await inquirer.prompt([{
			type: 'confirm',
			name: 'shouldReinitialiseXen',
			message: `It looks like Xen has already been initialised. Do you want to reinitialise it?`
		}])
	
		if(!shouldReinitialiseXen) {
			ora(`Exiting. If you would like to reinitialise Xen, run ${chalk.underline('xen init')} and type ${chalk.underline('Y')}.`).warn()
			process.exit()
		} else console.log()
	}

	/**
	 * Ask the user which Atlas API endpoint should be used
	 * in order to setup this instance of Xen.
	 */
	logSplitter('Identifying Atlas', { number: 1, newline: false })
	let { atlasEndpoint } = await inquirer.prompt([{
		type: 'list',
		name: 'atlasEndpoint',
		message: 'Which Atlas endpoint do you want to authenticate this Xen instance from?',
		choices: [
			'atlas.cryb.app',
			'localhost:5500',
			'Custom'
		]
	}])

	/**
	 * If the choice was 'Custom', ask the user for the URL
	 * of the Atlas API endpoint that should be used to setup
	 * Xen.
	 */
	if(atlasEndpoint === 'Custom') {
		const { newAtlasEndpoint } = await inquirer.prompt([{
			type: 'input',
			name: 'newAtlasEndpoint',
			message: 'What is the API URL of the Atlas endpoint?'
		}])

		atlasEndpoint = newAtlasEndpoint
	}

	/**
	 * If no http:// or https:// hostname was found,
	 * append http:// to the Atlas API endpoint.
	 */
	if(!atlasEndpoint.match(/^[a-zA-Z]+:\/\//))
		atlasEndpoint = `http://${atlasEndpoint}`

	/**
	 * Create a placeholder 'atlasUrl' variable
	 */
	let atlasUrl

	try {
		/**
		 * Try create a new URL object from the
		 * string containing the Atlas API endpoint.
		 *
		 * If it fails, the program will exit.
		 */
		atlasUrl = new URL(atlasEndpoint)
	} catch(error) {
		return ora('This URL doesn\'t seem valid - try again with a different URL.').fail()
	}

	/**
	 * If the endpoint given is not localhost,
	 * replace the http:// protocol with https://.
	 */
	if(atlasUrl.hostname !== 'localhost')
		atlasUrl = new URL(atlasEndpoint.replace('http://', 'https://'))

	/**
	 * Alert the user the Atlas API endpoint is being
	 * contacted and define two empty variables for later use.
	 */
	const atlasReachout = ora(`Contacting ${chalk.cyan(atlasEndpoint)}...`).start()
	let instanceUrl, portalRepository

	try {
		/**
		 * Send a GET request to /status of the Atlas API
		 * endpoint. If successful, this endpoint will return
		 * the instance URL and the origin of the @cryb/portal
		 * repository that should be pulled by Xen.
		 */
		const { data: { instance, origin } } = await axios.get(`${atlasUrl.origin}/status`)

		instanceUrl = instance
		portalRepository = origin
	} catch(error) {
		return atlasReachout.fail('We couldn\'t contact this Atlas instance. Please try again later.')
	}

	/**
	 * On success, alert the user that the Atlas API endpoint was
	 * successfully contacted.
	 */
	atlasReachout.succeed(`Contacted ${chalk.cyan(atlasUrl.origin)}!`)

	/**
	 * Use the update script in order to pull the @cryb/portal
	 * repository into /bin/portal from the aforementioned
	 * repository URL.
	 */
	await require('./update')(program, portalRepository)

	/**
	 * Ask the user for their Atlas authentication code
	 * for setting up a new Xen instance. This is a 6-digit
	 * number.
	 */
	logSplitter('Authorizing Xen', { number: 3 })
	const { authenticationCode } = await inquirer.prompt([{
		type: 'number',
		name: 'authenticationCode',
		message: 'What\'s your Atlas authentication code?',

		validate: input => {
			if(`${input}`.length !== 6) return 'This code is not valid - please try again.'

			return true
		}
	}])

	/**
	 * Alert the user that this code will be verified against the
	 * Atlas API. This will also create two empty variables, id and
	 * token for future use.
	 */
	const verifyingCode = ora('Verifying code...').start()
	let id, vm, token

	try {
		/**
		 * A POST request will be sent to /code of the Atlas
		 * API endpoint in order to verify the code. If successful,
		 * the endpoint will return the ID of the Xen instance and
		 * a token that will be stored and used for further authentication.
		 */
		const { data: { id: _id, vm: _vm, token: _token } } = await axios.post(`${atlasUrl.origin}/code`, { code: authenticationCode })

		id = _id
		vm = _vm
		token = _token
	} catch(error) {
		return verifyingCode.fail('This code is incorrect. Please try again later.')
	}

	/**
	 * Alert the user a token was recieved from Atlas.
	 */
	verifyingCode.succeed(`Recieved token from ${chalk.cyan(atlasUrl.origin)}!`)

	/**
	 * Alert the user setup has finished.
	 */
	logSplitter('Final Steps', { number: 4 })
	ora(`Setup successfully!`).succeed()

	/**
	 * Save the Xen ID, Atlas Endpoint and token to a config.json file.
	 */
	fs.writeFileSync('config.json', JSON.stringify({ id, url: atlasEndpoint, token }), 'utf8')

	/**
	 * Ask the user if they want to go into serving this
	 * instance of Xen now setup is completed.
	 */
	if(program.rawArgs.indexOf('serve') === -1) {
		const { serveXen } = await inquirer.prompt([{
			type: 'confirm',
			name: 'serveXen',
			message: `Would you like to serve Xen for ${instanceUrl}?`
		}])
	
		if(serveXen)
			require('./serve')(program)
		else
			ora(`Exiting. If you would like to serve Xen, run ${chalk.underline('xen serve')}.`).warn()
	}

	resolve()
})