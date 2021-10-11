const { SlashCommandBuilder } = require('@discordjs/builders');
const { accessSize } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getlistinfo')
		.setDescription('Waiting list info'),

	async execute(interaction) {
    if (interaction.user.id === '766919742610079784') {
      const listSize = await Tags.findAll();
      //do tags
    }
  }
}