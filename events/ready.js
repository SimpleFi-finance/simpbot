const { Tags } = require('../db');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
    Tags.sync({ force: true });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};