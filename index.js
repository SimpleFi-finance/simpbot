const fs = require('fs');
require('dotenv').config();
// const {Client, Collection, Intents}  = require('discord.js')
const client = require('./client')
const { token, adminPrefix } = require('./config.json');

// const myIntents = new Intents();
// myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES);

// const client = new Client({ intents: myIntents, partials: ['CHANNEL'] });
// console.log(' ---> client.guilds', client.guilds);

// client.commands = new Collection();
// client.adminCommands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

const adminCommandFiles = fs.readdirSync('./adminCommands').filter(file => file.endsWith('.js'));
for (const file of adminCommandFiles) {
	const adminCommand = require(`./adminCommands/${file}`);
	client.adminCommands.set(adminCommand.name, adminCommand);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.on('messageCreate', async message =>{
  // console.log(' ---> hasRole', message.member.roles.cache.find(r => r.name === 'admin'));
  // console.log(' ---> message.guild from index super', message.guild);
  if(!message.content.startsWith(adminPrefix) || message.author.bot) return;
  // console.log(' ---> message index', message);
  // console.log(' ---> message.partial', message.partial);
  // console.log(' ---> message.member', message.member);

    // console.log(' ---> message.guild from index first', message.guild);

    const args = message.content.slice(adminPrefix.length + 1).split(' ');
    const commandName = args.shift();
    // console.log(' ---> message.guild from index', message.guild);
    // console.log(' ---> message from index', message.guild.roles);
    const command = client.adminCommands.get(commandName);

    if (!command) return;

    try {
      await command.execute(message, ...args);
      return;
    } catch (err) {
      console.error(err);
    }
});


client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

	try {
		await command.execute(interaction);
    return;

	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);