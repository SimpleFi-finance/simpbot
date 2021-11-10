const client = require('../client');
const { Users, Lists } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

// Add role
const messageUser = async (member) => {
  // try {
    await member.send(`Good news ${member}, you now have access to the beta! You also have access to the private #beta-testers channel - please leave your feedback there! Launch the app on https://simplefi.finance. You access code is ${member.passCode}`)
  // } catch (error) {
  //   throw error;
  // }
};

const addRoleToUser = async (member, role) => {
  try {
    await member.roles.add(role);
  } catch (error) {
    throw error;
  }
};



module.exports = {
  name: 'increase-beta',
	description: 'Increase beta access list size',

  // Admin check
  async execute(message, newAccessSize) {
    if (!adminCheck(message) || !newAccessSize) {
      message.author.send('Naughty, naughty!')
      return;
    }

    // TODO: change name to access role
    const guild = client.guilds.cache.get(process.env.GUILD_ID)
    const betaRole = guild.roles.cache.find(r => r.name === process.env.WAITLIST_ROLE);
    const waitlistChannel = client.channels.cache.get(process.env.WAITLIST_CHANNEL);
    const errLogChannel = client.channels.cache.get(process.env.ERROR_LOGS_CHANNEL);
    let currAccessSize,
    allUsers;
    
    // All DB interactions
    try {
      const waitlist = await Lists.findOne({where: {name: process.env.WAITLIST_NAME}});
      currAccessSize = waitlist.dataValues.size
      newAccessSize = parseInt(newAccessSize);
      
      // Only increase size check
      if (newAccessSize <= currAccessSize) {
        //TODO: send author message when successful
        //TODO: message all existing beta-testers to say hi to the new ones? Tell them new version?
        message.author.send(`You can only increase the access list. Currently it is ${currAccessSize}`);
        return;
      }
      

      // Update the list with new max size
      await Lists.update (
        {size: newAccessSize},
        {where: {name: process.env.WAITLIST_NAME}}
      );

      allUsers = await Users.findAll({
        order: [
          ['id', 'ASC']
        ]
      });
    } catch(error) {
      console.error(error);
      message.author.send(`Something went wrong with the DB - no DMs sent or roles added: \nerror: ${error.name} \nmessage: ${error.message}`);
      return
    }


      const currBetaUsers = allUsers.slice(0, currAccessSize);
      const newBetaUsers = allUsers.slice(currAccessSize, newAccessSize);

      // Set up add roles and send DMs
      const rolePromises = [];
      const roleErrors = [];
      const messagePromises = [];
      const messageErrors = [];
      try {
        for (let newBetaUser of newBetaUsers) {
          const member = await guild.members.fetch(newBetaUser.userId);
          rolePromises.push(addRoleToUser(member, betaRole));
          messagePromises.push(messageUser(member));
        }
      } catch (error) {
          console.error(' ---> error fetching user Id', error);
      }

      const promises = await Promise.allSettled(messagePromises);
      // to check who has been rejected and why
      const rejected = promises.filter(el => el.status === 'rejected');
      console.log('rejected[0].reason', rejected[0].reason);
      console.log('rejected[0].reason', rejected[0].reason.name);
	},
};