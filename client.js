const {Client, Collection, Intents}  = require('discord.js')

const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES);

const client = new Client({ intents: myIntents, partials: ['CHANNEL'] });
console.log(' ---> client.guilds', client.guilds);

client.commands = new Collection();
client.adminCommands = new Collection();

module.exports = client;