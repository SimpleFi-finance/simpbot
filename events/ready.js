const { Users } = require('../db');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
    Users.sync({ force: true });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};