const { Users, Lists } = require('../db');
const { SlashCommandBuilder } = require('@discordjs/builders');
const generator = require('generate-password');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('waitlist')
		.setDescription('Adds you to waitlist and tells you your position'),

	async execute(interaction) {

    const waitlist = await Lists.findOne({where: {name: process.env.WAITLIST_NAME}});
    const accessSize = waitlist.dataValues.size;

    //Set correct channel id for users to create interaction
    if (interaction.channelId !== process.env.WAITLIST_CHANNEL) {
      await interaction.reply(`Only use this command in the waitlist channel`);
      return;
    }

    const {username, discriminator, id} = interaction.user;
    // equivalent to: SELECT * FROM users WHERE name = 'handle' LIMIT 1;

    try {
      const user = await Users.findOne({ where: { handle: username + discriminator } });

      // Deal with user who already registered
      if (user) {
        const userPosition = user.dataValues.id;

        if (userPosition <= accessSize) {
          await interaction.user.send(`You already have access and your code is ${user.dataValues.passCode}`)
          await interaction.reply(`${interaction.user} you already have access silly! Check your DMs.`);
        } else {
          await interaction.user.send(`You're on the waiting list and your position is No.${userPosition - accessSize}`)
          await interaction.reply(`${interaction.user} you're already on the waiting list - check your DMs for wen access!`);
        }

      } else {
        const passCode = generator.generate({
          length: 6,
          numbers: true
        });
        // register user on DB - equivalent to: INSERT INTO users (handle, userId, passcode) values (?, ?, ?);
        const newUser = await Users.create({
          handle: `${username}${discriminator}`,
          userId: id,
          passCode: passCode
        });
        
        const users = await Users.findAll();

        const userPosition = users.length;

        if (userPosition <= accessSize) {
          const betaRole = await interaction.guild.roles.cache.find(r => r.name === 'beta tester');
          
          //give the new user access to beta-testers channel
          await interaction.member.roles.add(betaRole);
          await interaction.newUser.send(
            "You've been authorised. Your access code is " + passCode +
            "\nYou now have access to the beta-testers channel. Please give us your feedback!");
          await interaction.reply(`Hi ${interaction.user}, you're one of the lucky ones! Check your DMs 👀`)
        } else {
          await interaction.user.send(`You're on the waiting list! Your current position is No.${userPosition - accessSize}`);
          await interaction.reply(`Hi ${interaction.user}, you'll have access soon! Please check your DMs.`)
        }
      }

    } catch (error) {
      console.error('Waitlist error -->', error);
      await interaction.reply('Oops something went wrong. Please DM a team member.');
    }
  }
}