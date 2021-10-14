const client = require('../client');
const { Users, Lists, Op } = require('../db');
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

      const newBetaUsers = await Users.findAll({
        where: {
          id: {
            [Op.between]: [currAccessSize +1, newAccessSize]
          }
        }
      });

      // Send direct messages to each new user accessing the beta
      for (let newBetaUser of newBetaUsers) {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const member = await guild.members.fetch(newBetaUser.userId);
        const betaRole = guild.roles.cache.find(r => r.name === 'beta tester');
        await member.roles.add(betaRole);
        await member.send(`Good news ${member}, you now have access to the beta! You access code is ${newBetaUser.passcode}`)
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