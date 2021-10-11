const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('batch-increase')
		.setDescription('Release next waitlist batch'),

	async execute(interaction) {
    console.log(interaction.options.getMember('admin'));
  }
}