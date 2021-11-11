const client = require('../client');
const { Users, Lists } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

// Filters rejected promises and appends user data
function filterRejectedPromises(promises, users) {
  const rejectedPromises = promises.filter((el, i) => {
    if (el.status === 'rejected') el.user = users[i];
    return el.status === 'rejected';
  });
  return rejectedPromises;
}

module.exports = {
  name: 'increase-beta',
  description: 'Increase beta access list size',

  // Admin check
  async execute(message, newAccessSize) {
    if (!adminCheck(message) || !newAccessSize) {
      message.author.send('Naughty, naughty!');
      return;
    }

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const accessRole = guild.roles.cache.find(r => r.name === process.env.WAITLIST_ROLE);
    const waitlistChannel = client.channels.cache.get(process.env.WAITLIST_CHANNEL);
    const errLogChannel = client.channels.cache.get(process.env.ERROR_LOGS_CHANNEL);
    let
      currAccessSize,
      allUsers;

    // All DB interactions
    try {
      const waitlist = await Lists.findOne({ where: { name: process.env.WAITLIST_NAME } });
      currAccessSize = waitlist.dataValues.size;
      newAccessSize = parseInt(newAccessSize);

      // Only increase size check
      if (newAccessSize <= currAccessSize) {
        message.author.send(`You can only increase the access list. Currently it is ${currAccessSize}`);
        return;
      }

      // Update the list with new max size
      await Lists.update(
        { size: newAccessSize },
        { where: { name: process.env.WAITLIST_NAME } }
      );

      allUsers = await Users.findAll({
        order: [
          ['id', 'ASC']
        ]
      });
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
      message.author.send(`Something went wrong with the DB - no DMs sent or roles added: \nerror: ${error.name} \nmessage: ${error.message}`);
      return;
    }
    // TODO: message all existing beta-testers to say hi to the new ones? Tell them new version?
    // const currBetaUsers = allUsers.slice(0, currAccessSize);
    const newBetaUsers = allUsers.slice(currAccessSize, newAccessSize);

    // Set up add roles and send DMs
    const rolePromises = [];
    const messagePromises = [];
    for (const newBetaUser of newBetaUsers) {
      let member;
      try {
        member = await guild.members.fetch(newBetaUser.userId);
      } catch (error) {
        message.author.send(`There was an error fetching <@${newBetaUser.userId}>'s data from Discord`);
        console.error(' ---> error fetching user Id', error); // eslint-disable-line no-console
      }
      rolePromises.push(member.roles.add(accessRole));
      messagePromises.push(member.send(`Good news ${member}, you now have access to the beta! Launch the app on https://simplefi.finance. Your access code is ${newBetaUser.passCode} \nYou also have access to the private #beta-testers channel. Please leave your feedback, there it may earn you some rewards  😉 🐳`));
    }

    const settledMessagePromises = await Promise.allSettled(messagePromises);
    const settledRolePromises = await Promise.allSettled(rolePromises);
    // filters rejects & adds user data (Discordjs errors do not contain user info)
    const rejectedMessagePromises = filterRejectedPromises(settledMessagePromises, newBetaUsers);
    const rejectedRolePromises = filterRejectedPromises(settledRolePromises, newBetaUsers);

    // Log DM errors and inform users who didn't receive access DMs
    if (rejectedMessagePromises.length) {
      console.error(' ---> rejectedMessagePromises', rejectedMessagePromises); // eslint-disable-line no-console
      let rejectedUsersMessage = 'Hey ';
      for (const rejectedPromise of rejectedMessagePromises) {
        errLogChannel.send(`command: increase-beta \ninternal code: DM issue \nuser: <@${rejectedPromise.user.userId}> \nerror name: ${rejectedPromise.reason.name} \nerror message: ${rejectedPromise.reason.message} \naccess status: user has access - passCode is ${rejectedPromise.user.passCode} \n---`);
        rejectedUsersMessage += `<@${rejectedPromise.user.userId}>, `;
      }
      rejectedUsersMessage = `${rejectedUsersMessage.slice(0, -1)} you now have access to the beta, but I couldn't DM you the access instructions  🥺  \nPlease either allow DMs from this server and type "/waitlist" here again, or get in touch with the team!`;
      waitlistChannel.send(rejectedUsersMessage);
    }

    // Log role errors
    if (rejectedRolePromises.length) {
      console.error(' ---> rejectedRolePromises', rejectedRolePromises); // eslint-disable-line no-console
      for (const rejectedPromise of rejectedRolePromises) {
        errLogChannel.send(`command: increase-beta \ninternal code: assign role issue \nuser: <@${rejectedPromise.user.userId}> \nerror name: ${rejectedPromise.reason.name} \nerror message: ${rejectedPromise.reason.message} \n---`);
      }
    }
    // conclusion message
    message.author.send(`Access increased to ${newAccessSize} from ${currAccessSize}! \nThere were ${rejectedMessagePromises.length} DM errors and ${rejectedRolePromises.length} role errors.${(rejectedMessagePromises.length || rejectedRolePromises.length) ? ' Check the logs channel for details.' : ''}`);
  }
};
