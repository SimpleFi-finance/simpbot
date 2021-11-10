const client = require('../client');
const { Users, Lists } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

// Filters rejected promises and appends user data
function filterRejectedPromises (promises, users) {
  const rejectedPromises = promises.filter((el, i) => {
    if (el.status === 'rejected') el.user = users[i];
    return el.status === 'rejected'
  });
  return rejectedPromises;
}

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
      const messagePromises = [];
      for (let newBetaUser of newBetaUsers) {
        let member;
        try {
          member = await guild.members.fetch(newBetaUser.userId);
        } catch (error) {
          //TODO: channel and author
          console.error(' ---> error fetching user Id', error);
        }
        rolePromises.push(member.roles.add(betaRole));
        messagePromises.push(member.send(`Good news ${member}, you now have access to the beta! You also have access to the private #beta-testers channel - please leave your feedback there! Launch the app on https://simplefi.finance. You access code is ${newBetaUser.passCode}`));          
      }

      const settledMessagePromises = await Promise.allSettled(messagePromises);
      const settledRolePromises = await Promise.allSettled(rolePromises);
      // unhelpfully, Discordjs errors do not contain the target user
      const rejectedMessagePromises = filterRejectedPromises (settledMessagePromises, newBetaUsers);
      console.log(' ---> rejectedMessagePromises', rejectedMessagePromises);
      const rejectedRolePromises = filterRejectedPromises (settledMessagePromises, newBetaUsers);

      if (rejectedMessagePromises.length) {
        let rejectedUsersMessage = 'Hey ';
        for (let rejectedPromise of rejectedMessagePromises) {
          //TODO: log channel error message
          console.log(' ---> Increase beta DM error', rejectedPromise);  
          rejectedUsersMessage += `<@${rejectedPromise.user.userId}>, `
        }
        rejectedUsersMessage = rejectedUsersMessage.substring(0, -2) + " you now have access to the beta but I couldn't DM you your access code  🥺  \nPlease either allow DMs from this server and type /waitlist here again, or get in touch with the team!";
        waitlistChannel.send(rejectedUsers);
      }
	},
};