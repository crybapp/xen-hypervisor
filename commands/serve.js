const fs = require('fs')
const ora = require('ora')
const chalk = require('chalk')
const inquirer = require('inquirer')
const { Client } = require('@cryb/mesa')

const { logSplitter } = require('../utils')
const { url, token } = require('../config.json')
const { createClient } = require('../drivers/docker.driver')

/**
 * This file is still in development.
 */
module.exports = async program => {
	if (!fs.existsSync('config.json')) {
		const { initialiseXen } = await inquirer.prompt([{
			type: 'confirm',
			name: 'initialiseXen',
			message: `It looks like Xen hasn't been initialised. Do you want to initialise it?`
		}])
	
		if (initialiseXen)
			await require('./init')(program)
		else {
			ora(`Exiting. If you would like to initialise Xen, run ${chalk.underline('xen init')}.`).warn()
			process.exit()
		}
	}

	if (!fs.existsSync('bin/portal'))
		require('./update')(program)

	logSplitter('Connecting to Atlas', {
		newline: program.rawArgs.indexOf('serve') === -1
	})

	let connectingToAtlas,
		authenticatingWithAtlas,
		reconnectingToAtlas

	connectingToAtlas = ora(`Connecting to Atlas...`).start()

	const client = new Client(url)

	client.on('connected', async () => {
		if (reconnectingToAtlas) {
			reconnectingToAtlas.succeed('Reconnected to Atlas!')
			reconnectingToAtlas = null
		} else 
			connectingToAtlas.succeed('Connected to Atlas!')

		authenticatingWithAtlas = ora(`Authenticating with Atlas...`).start()
		const user = await client.authenticate({ token })
		authenticatingWithAtlas.succeed('Authenticated with Atlas!')
	})

	client.on('message', message => {
		ora(`Recieved ${message.serialize()} from Atlas`).info()
	})

	client.on('disconnected', (code, reason) => {
		if (reconnectingToAtlas)
			reconnectingToAtlas.stop()

		if (authenticatingWithAtlas)
			authenticatingWithAtlas.stop()
		
		reconnectingToAtlas = ora('Disconnected from Atlas - reconnecting...').start()
	})

	client.on('error', error => {
		if (!reconnectingToAtlas) return

		if (authenticatingWithAtlas)
			authenticatingWithAtlas.stop()

		reconnectingToAtlas.fail(`Atlas connection error: ${error.message}`)
		reconnectingToAtlas = ora('Disconnected from Atlas - reconnecting...').start()
	})

	// logSplitter('Serving Xen', {
	// 	newline: program.rawArgs.indexOf('serve') === -1
	// })

	// const client = createClient(url, token)
	// 		building = ora('Building Docker image...').start()

	// const stream = await client.buildImage({
	// 	context: `${__dirname.split('/').splice(0, __dirname.split('/').length - 1).join('/')}/bin/portal`,
	// 	src: ['Dockerfile']
	// })

	// stream.on('data', data => {
	// 	try {
	// 		const { stream } = JSON.parse(data.toString())

	// 		building.text = `Building Docker image: ${stream}`
	// 	} catch (error) {}
	// })

	// stream.on('done', data => console.log(JSON.parse(data.toString())))

	// try {
	// 	await new Promise((resolve, reject) => 
	// 		client.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res))
	// 	)
	// } catch (error) {
	// 	return building.fail(`Fail building Docker image: ${error}`)
	// }

	// building.succeed('Docker image successfully built')

	// const starting = ora('Starting Docker image...').start(),
	// 		name = `xen-${Date.now()}`
	// 		container = await client.createContainer({
	// 			name,
	// 			hostname: name,
	// 			image: process.env.DOCKER_IMAGE || 'cryb/portal',
	// 			autoRemove: true,
	// 			networkMode: 'bridge',
	// 			shmSize: parseInt(process.env.DOCKER_SHM_SIZE || '1024') * 1048576
	// 		})

	// await container.start()
	// starting.succeed('Docker image started!')
}