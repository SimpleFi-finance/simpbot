const fs = require('fs');
require('dotenv').config();
const client = require('./client');

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`); // eslint-disable-line
  client.commands.set(command.data.name, command);
}

const adminCommandFiles = fs.readdirSync('./adminCommands').filter(file => file.endsWith('.js'));
for (const file of adminCommandFiles) {
  const adminCommand = require(`./adminCommands/${file}`); // eslint-disable-line
  client.adminCommands.set(adminCommand.name, adminCommand);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`); // eslint-disable-line
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.on('messageCreate', async message => {
  if (!message.content.startsWith(process.env.ADMIN_PREFIX) || message.author.bot) return;
  console.log(message.content); // eslint-disable-line no-console
  const args = message.content.slice(process.env.ADMIN_PREFIX.length + 1).split(' ');
  const commandName = args.shift();
  const command = client.adminCommands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, ...args);
    return;
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
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
    console.error(error); // eslint-disable-line no-console
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
