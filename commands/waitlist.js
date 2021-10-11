const fs = require('fs');
const Tags = require('../db');
const { SlashCommandBuilder } = require('@discordjs/builders');
const generator = require('generate-password');
const { accessSize, waitListChannel } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('waitlist')
		.setDescription('Adds you to waitlist and tells you your position'),

	async execute(interaction) {

    //Set correct channel id for users to create interaction
    if (interaction.channelId !== '896787466055467048') {
      await interaction.reply(`Only use this command in the waitlist channel`);
      return;
    }

    const {username, discriminator} = interaction.user;
    // equivalent to: SELECT * FROM tags WHERE name = 'tagName' LIMIT 1;

    try {
      const tag = await Tags.findOne({ where: { handle: username + discriminator } });

      // Deal with user who already registered
      if (tag) {
        const userPosition = tag.dataValues.id;

        if (userPosition <= accessSize) {
          await interaction.user.send(`You already have access and your code is ${tag.dataValues.passcode}`)
          await interaction.reply(`${interaction.user} you already have access silly! Check your DMs.`);
        } else {
          await interaction.user.send(`You're on the waiting list and your position is ${userPosition - accessSize}`)
          await interaction.reply(`${interaction.user} you're already on the waiting list - check your DMs for wen access!`);
        }

      } else {
        const passcode = generator.generate({
          length: 6,
          numbers: true
        });
        // register user on DB - equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
        const tag = await Tags.create({
          handle: `${username}${discriminator}`,
          passcode: passcode
        });

        const userPosition = tag.dataValues.id;

        if (userPosition <= accessSize) {
          await interaction.user.send(`You've been authorised. Your access code is ${passcode}`);
          await interaction.reply(`Hi ${interaction.user}, you're one of the lucky ones! Check your DMs 👀`)
        } else {
          await interaction.user.send(`You're on the waiting list and your position is ${userPosition - accessSize}`);
          await interaction.reply(`Hi ${interaction.user}, you'll have access soon! Please check your DMs.`)
        }
      }

    } catch (error) {
      console.error('Waitlist error -->', error);
      await interaction.reply('Oops something went wrong. Please DM a team member.');
    }
  }
}