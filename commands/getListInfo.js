const { SlashCommandBuilder } = require('@discordjs/builders');
const Tags = require('../db');
const { accessSize } = require('../config.json');


module.exports = {
  data: new SlashCommandBuilder()
		.setName('get-list')
		.setDescription('Get waitlist info'),

	async execute(interaction) {

    try {
      const listSize = await Tags.findAll();
      interaction.user.send('There are ' + listSize.length + ' people in the list \n and ' + accessSize + ' list members have beta access');
      return;
    }
    catch(err) {
      console.error(err);
    }
	},
};


/*
const { SlashCommandBuilder } = require('@discordjs/builders');
const { accessSize } = require('../../config.json');

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
*/