const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('batch-increase')
		.setDescription('Release next waitlist batch'),

	async execute(interaction) {
    if (interaction.user.id === '766919742610079784') {
      
    }
  }
}