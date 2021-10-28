const client = require('../client');
const { Users, Lists } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

module.exports = {
  name: 'increase-beta',
	description: 'Increase beta access list size',

  async execute(message, newAccessSize) {
    if (!adminCheck(message) || !newAccessSize) {
      message.author.send('Naughty, naughty!')
      return;
    }

    try {
      const waitlist = await Lists.findOne({where: {name: process.env.WAITLIST_NAME}});
      const currAccessSize = waitlist.dataValues.size
      newAccessSize = parseInt(newAccessSize);
      
      if (newAccessSize <= currAccessSize) {
        message.author.send(`You can only increase the access list. Currently it is ${currAccessSize}`);
        return;
      }

      // Update the list with new max size
      await Lists.update (
        {size: newAccessSize},
        {where: {name: process.env.WAITLIST_NAME}}
      );

      const allUsers = await Users.findAll({
        order: [
          ['userId', 'ASC']
        ]
      });
      console.log(allUsers);
      const newBetaUsers = allUsers.slice(currAccessSize, newAccessSize);
      console.log(newBetaUsers);
      // Send direct messages to each new user accessing the beta
      for (let newBetaUser of newBetaUsers) {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const member = await guild.members.fetch(newBetaUser.userId);

        const betaRole = guild.roles.cache.find(r => r.name === 'beta tester');
        console.log(betaRole);
        await member.roles.add(betaRole);
        console.log('after beta role')
        console.log(newBetaUser.passCode);
        await member.send(`Good news ${member}, you now have access to the beta! You also have access to the private #beta-testers channel - please leave your feedback there! Launch the app on https://simplefi.finance. You access code is ${newBetaUser.passCode}`)
      }

    } catch(err) {
      console.error(err);
    }
	},
};