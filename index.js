#!/usr/bin/env node
const program = require('commander')

program
	.option('init', 'Initialise a new Xen instance')
	.option('serve', 'Connect to the configured Atlas instance')
	.option('update', 'Force an update from GitHub')
	.option('remove', 'Remove the current Xen instance')

program.parse(process.argv)

if(program.init)
	require('./commands/init')(program)
else if(program.update)
	require('./commands/update')(program)
else if(program.serve)
	require('./commands/serve')(program)
else if(program.remove)
	require('./commands/remove')(program)
else
	console.log(program.helpInformation())