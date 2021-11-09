const { Users, Lists } = require('../db');
const { SlashCommandBuilder } = require('@discordjs/builders');
const generator = require('generate-password');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('waitlist')
		.setDescription('Adds you to waitlist and tells you your position'),

	async execute(interaction) {

    const waitlist = await Lists.findOne({ where: { name: process.env.WAITLIST_NAME } });
    const accessSize = waitlist.dataValues.size;

    //Set correct channel id for users to create interaction
    if (interaction.channelId !== process.env.WAITLIST_CHANNEL) {
      await interaction.reply(`Only use this command in the waitlist channel`);
      return;
    }

    const {username, discriminator, id} = interaction.user;
    //Set up something
    let user, newUser;
    // Create flag for potential error message
    let userHasAccess = false;

    try {
      // equivalent to: SELECT * FROM users WHERE name = 'handle' LIMIT 1;
      user = await Users.findOne({ where: { handle: username + discriminator } });
      console.log(' ---> user', user);

      // Deal with user who already registered
      if (user) {
        const users = await Users.findAll({
          order: [
            ['id', 'ASC']
          ]
        });

        const userPosition = users.findIndex(el => el.passCode === user.passCode);

        if (userPosition + 1 <= accessSize) {
          userHasAccess = true;
          await interaction.user.send(`You already have access and your code is ${user.dataValues.passCode}`)
          await interaction.reply(`${interaction.user} you already have access silly! Check your DMs.`);
        } else {
          await interaction.user.send(`You're on the waiting list and your position is No.${userPosition + 1 - accessSize}`)
          await interaction.reply(`${interaction.user} you're already on the waiting list - check your DMs for wen access!`);
        }

      } else {
        const passCode = generator.generate({
          length: 9,
          numbers: true
        });
        // register user on DB - equivalent to: INSERT INTO users (handle, userId, passcode) values (?, ?, ?);
        newUser = await Users.create({
          handle: `${username}${discriminator}`,
          userId: id,
          passCode: passCode
        });
        console.log(' ---> newUser', newUser);

        const users = await Users.findAll({
          order: [
            ['id', 'ASC']
          ]
        });
        console.log(' ---> users', users);

        //works on db index not userID - check with increase-beta
        const userPosition = users.findIndex(el => el.passCode === passCode);
        console.log(' ---> userPosition', userPosition);

        if (userPosition + 1 <= accessSize) {
          userHasAccess = true;
          const betaRole = interaction.guild.roles.cache.find(r => r.name === 'beta tester');
          //give the new user access to beta-testers channel
          await interaction.member.roles.add(betaRole);
          await interaction.user.send(
            "You've been authorised. Your access code is " + passCode +
            "\nYou now have access to the beta-testers channel. Please give us your feedback!");
          await interaction.reply(`Hi ${interaction.user}, you're one of the lucky ones! Check your DMs 👀`)
        } else {
          await interaction.user.send(`You're on the waiting list! Your current position is No.${userPosition + 1 - accessSize}`);
          await interaction.reply(`Hi ${interaction.user}, you'll have access soon! Please check your DMs.`)
        }
      }

    } catch (error) {

      console.error('Waitlist error --->', error);

      if (error.message === 'Cannot send messages to this user') {
        const privacyReply = `Hi ${interaction.user} I can't DM you with your access code 😢 You may need to allow DMs from this server's members.`
        const dbConfirmReply = "I checked and you're on the waitlist though! Contact a member of the team to get your position."

          await interaction.reply(`${privacyReply} ${userHasAccess && dbConfirmReply}`);

      } else {
        await interaction.reply('Oops something went wrong. Please DM a team member.');
      }
    }
  }
}