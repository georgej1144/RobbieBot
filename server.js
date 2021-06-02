const DiscordJS = require('discord.js')
const fs = require('fs')
require('dotenv').config()

const guildId = '550046418908348426' //'470027130051362829'	//change to 550046418908348426 when ready to put in RR discord

var slangDict

const loadDict = () => {
	fs.readFile('dict.json', 'utf-8', (err, data) => {
		if(err) {
			throw err
		}
		slangDict = JSON.parse(data.toString())
	})
}

loadDict();


const saveDict = (data) => {
	fs.writeFile('dict.json', data, (err) => {
		if(err) {
			throw err
		}
		console.log("dict saved")
	})
}

const client = new DiscordJS.Client()
const getApp = (guildId) => {
	const app = client.api.applications(client.user.id)
	if(guildId) {
		app.guilds(guildId)
	}
	return app
}

client.on('ready', async () => {
	console.log('The bot is ready')
	
	const commands = await getApp(guildId)
		.commands.get()

	await getApp(guildId).commands.post({
		data: {
			name: 'whatis',
			description: 'Get a definition for commonly used slang',
			options: [
				{
					name: 'slang',
					description: 'the slang word/term to look up',
					required: true,
					type: 3,
				}
			]
		}
	})

	await getApp(guildId).commands.post({
		data: {
			name: 'slangadd',
			description: 'Add a slang term to the bot',
			options: [
				{
					name: 'slang',
					description: 'the slang term',
					required: true,
					type: 3,
				},
				{
					name: 'definition',
					description: 'a short definition/explaination of the slang term',
					required: true,
					type: 3,
				},
				{
					name: 'password',
					description: 'permission check. if you are a mentor or think you should have access to this feature, ask George.',
					required: true,
					type: 3,
				}
			]
		}
	})

	await getApp(guildId).commands.post({
		data: {
			name: 'slangdel',
			description: 'Delete a slang term from the dictionary',
			options: [
				{
					name: 'slang',
					description: 'the slang term to remove',
					required: true,
					type: 3,
				},
				{
					name: 'password',
					description: 'permission check. if you are a mentor or think you should have access to this feature, ask George.',
					required: true,
					type: 3,
				}
			]
		}
	})

	await getApp(guildId).commands.post({
		data: {
			name: 'slanglist',
			description: 'List all the slang in the dictionary',
		}
	})

	client.ws.on('INTERACTION_CREATE', async (interaction) => {
		const {name, options} = interaction.data
		const command = name.toLowerCase()
		
		if(command === 'ping') {
			reply(interaction, 'pong')
		}

		if(command === 'whatis') {
			console.log(command)
			if(typeof slangDict[options[0].value.toLowerCase()] != "undefined" ) {
				reply(interaction, options[0].value.toLowerCase() + ": " + slangDict[options[0].value.toLowerCase()])
				return;
			}
			reply(interaction, options[0].value.toLowerCase() + " doesn't exist in the dictionary currently.")
		}

		if(command === 'slangadd') {
			console.log(command + " " + process.env.PASSWORD + " " + options[2].value)
			if(options[2].value !== process.env.PASSWORD) {
				reply(interaction, "Incorrect password. You need permission to use this command.")
				return
			}
			slangDict[options[0].value.toLowerCase()] = options[1].value.toLowerCase()
			saveDict(JSON.stringify(slangDict))
			reply(interaction, "**" + options[0].value.toLowerCase() + "** added to the dictionary with definition __" + slangDict[options[0].value.toLowerCase()] + "__")
		}
		
		if(command === 'slangdel') {
			console.log(command + " " + process.env.PASSWORD + " " + options[1].value)
			if(options[1].value !== process.env.PASSWORD) {
				reply(interaction, "Incorrect password. You need permission to use this command.")
				return
			}
			delete slangDict[options[0].value.toLowerCase()]
			saveDict(JSON.stringify(slangDict))
			reply(interaction, "Deleted slang term " + options[0].value.toLowerCase() + " from dictionary.")
		}

		if(command === 'slanglist') {
			console.log(command)
			let fullList = ""
			Object.keys(slangDict).forEach(key => {
				fullList += key + ": " + slangDict[key] + "\n"
			})
			console.log(fullList)
			reply(interaction, fullList)
		}
	})
})

const reply = (interaction, response) => {
	client.api.interactions(interaction.id, interaction.token).callback.post({
		data: {
			type: 4,
			data: {
				content: response,
			}
		}
	})
}

client.login(process.env.TOKEN)