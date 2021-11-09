const { Users, Lists } = require('../db');
const { SlashCommandBuilder } = require('@discordjs/builders');
const generator = require('generate-password');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('waitlist')
		.setDescription('Adds you to waitlist and tells you your position'),

	async execute(interaction) {

    //Check if command sent in correct channel
    if (interaction.channelId !== process.env.WAITLIST_CHANNEL) {
      await interaction.reply(`Only use this command in the waitlist channel`);
      return;
    }

    let user,
        newUser,
        users,
        userPosition,
        accessSize,
        channelMessage,
        dmStatusMessage,
        roleStatusMessage,
        dmToUser,
        userHasRole;
    let userHasAccess = false;
    const {username, discriminator, id} = interaction.user;
    // TODO: add this to .env
    //TODO: rename to accessRole?
    const betaRole = interaction.guild.roles.cache.find(r => r.name === 'beta tester');

    // All DB interactions
    try {
      const waitlist = await Lists.findOne({ where: { name: process.env.WAITLIST_NAME } });
      accessSize = waitlist.dataValues.size;

      //Check if user already exists or create one if not
      user = await Users.findOne({ where: { handle: username + discriminator } });
      if (!user) {
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
      }
  
      // Get list of existing users
      users = await Users.findAll({
        order: [
          ['id', 'ASC']
        ]
      });
    } catch (error) {
      console.error('waitlist db error --->', error)
      await interaction.reply("Something went wrong 😞 Please try again or contact a team member.");
    }

    // Get target user's position in Index
    userPosition = users.findIndex(el => {
      const targetUser = user ? user : newUser;
      return el.userId === targetUser.userId;
    })
    if (userPosition + 1 <= accessSize) {userHasAccess = true};

    // Set channel and DM messages
    if (user) {
      if (userHasAccess) {
        channelMessage = `${interaction.user} you already have access silly! `;
        dmStatusMessage = 'Check your DMs for instructions 👀'
        dmToUser = `You already have access and your code is ${user.dataValues.passCode}. Launch the app on https://simplefi.finance. `;
        roleStatusMessage = "\nRemember you can now leave feedback on the private #beta-testers channel. It may earn you some rewards 😉🐳"
      } else {
        channelMessage = `${interaction.user} you're already on the waiting list. `;
        dmStatusMessage = 'Check your DMs for wen access! 👀'
        dmToUser = `You're on the waiting list and your position is No.${userPosition + 1 - accessSize}`;
      }
    } else {
      if (userHasAccess) {
        channelMessage = `Hi ${interaction.user}, you're one of the lucky ones! `;
        dmStatusMessage = 'Check your DMs for instructions 👀'
        dmToUser =  "You now have access to the SimpleFi app 🥳 Launch it on https://simplefi.finance using this passcode: " +newUser.dataValues.passCode
        roleStatusMessage = "\nYou also have access to the beta-testers channel now. Please give us your feedback there - it may earn you some rewards 😉🐳";
      } else {
        channelMessage = `Hi ${interaction.user}, you're on the waiting list and will have access soon! `;
        dmStatusMessage = 'Check your DMs for wen access! 👀'
        dmToUser =  `You're on the waiting list! Your current position is No.${userPosition + 1 - accessSize}`
      }
    }

    // Attempt add role
    if (userHasAccess) {
      userHasRole = interaction.member.roles.cache.some(role => role.name === betaRole.name);
      if (!userHasRole) {
        try {
          await interaction.member.roles.add(betaRole);
        } catch (error) {
          console.error('Add role error --->', error);
          roleStatusMessage = "\nBut we had trouble giving you access to the private #beta-testers channel 😢 You could get rewards for leaving feedback there, so please contact a team member."
        }
      }
    }

    // Attempt DMs
    try {
      await interaction.user.send(dmToUser + roleStatusMessage)
    } catch (error) {
      console.error('DM error --->', error)
      if (error.message === 'Cannot send messages to this user') {
        dmStatusMessage = "But I can't send you the details 😢 \nPlease allow DMs from this server or contact a team member.";
      } else {
        channelMessage = 'Oops something went wrong. Please DM a team member.';
        dmStatusMessage = '';
      }
    } finally {
      await interaction.reply(channelMessage + dmStatusMessage);
    }
  }
}
