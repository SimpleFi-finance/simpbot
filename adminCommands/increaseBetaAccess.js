const client = require('../client');
const { Users, Lists } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

module.exports = {
  name: 'increase-beta',
	description: 'Increase beta access list size',

  async execute(message, newAccessSize) {
    console.log(message)
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

      const allUsers = await Users.findAll({
        order: [
          ['userId', 'ASC']
        ]
      });
      allUsers.length = newAccessSize;

      const newBetaUsers = allUsers.splice(0, currAccessSize - 1);
      console.log(newBetaUsers, allUsers)
      // Send direct messages to each new user accessing the beta
      for (let newBetaUser of newBetaUsers) {
        console.log(newBetaUser)
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const member = await guild.members.fetch(newBetaUser.userId);
        const betaRole = guild.roles.cache.find(r => r.name === 'beta tester');
        await member.roles.add(betaRole);
        await member.send(`Good news ${member}, you now have access to the beta! You access code is ${newBetaUser.passCode}`)
      }

      // Update the list with new max size
      await Lists.update (
        {size: newAccessSize},
        {where: {name: process.env.WAITLIST_NAME}}
      );
    } catch(err) {
      console.error(err);
    }
	},
};