const fs = require('fs');
const Tags = require('../db');
const { SlashCommandBuilder } = require('@discordjs/builders');
const generator = require('generate-password');
const { accessSize } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('waitlist')
		.setDescription('Adds you to waitlist and tells you your position'),

	async execute(interaction) {
    //Set correct channel id for users to create interaction
    if (interaction.channelId !== '896787466055467048') {
      return interaction.user.send(`Please message the waitlist channel to join the waitlist`);
    }

    const listSize = await Tags.findAll();

    const {username, discriminator} = interaction.user;
    // equivalent to: SELECT * FROM tags WHERE name = 'tagName' LIMIT 1;
    const tag = await Tags.findOne({ where: { handle: username + discriminator } });
    if (tag) {
      const userPosition = tag.dataValues.id;
      if (userPosition <= accessSize) {
        return interaction.reply(`You already have access and your code is ${tag.dataValues.passcode}`);
      } else {
        `You're already on the waiting list and your position is ${userPosition - accessSize}`;
      }    
    } else {
      const passcode = generator.generate({
        length: 6,
        numbers: true
      });

      try {      
      // equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
      const tag = await Tags.create({
        handle: `${username}${discriminator}`,
        passcode: passcode
      });

      const userPosition = tag.dataValues.id;

      if (userPosition <= accessSize) {
        await interaction.user.send(`You've been authorised. Your access code is ${passcode}`);
        return interaction.reply(`Hi ${interaction.user}, check your DMs!`)
      } else {
        await interaction.user.send(`You're on the waitlist and your position is ${userPosition - accessSize}`);
      }

      }
      catch (error) {
        console.error('DB error -->', error);
        // if (error.name === 'SequelizeUniqueConstraintError') {
        //   return interaction.reply('You\'re already on the list!');
        // }
        return interaction.reply('Something went wrong with adding you to the list.');
      }
    }
  }
}