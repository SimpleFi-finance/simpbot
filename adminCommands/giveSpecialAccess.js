const client = require('../client');
const { Users } = require('../db');
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
  name: 'special-access',
  description: 'Give beta access to arbitrary accounts',

  // Admin check
  async execute(message, ...targetIDs) {
    if (!adminCheck(message) || !targetIDs) {
      message.author.send('Naughty, naughty!');
      return;
    }

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const accessRole = guild.roles.cache.find(r => r.name === process.env.FEEDBACK_ROLE);
    const waitlistChannel = client.channels.cache.get(process.env.WAITLIST_CHANNEL);
    const feedbackChannel = client.channels.cache.get(process.env.FEEDBACK_CHANNEL);
    const errLogChannel = client.channels.cache.get(process.env.ERROR_LOGS_CHANNEL);
    let
      allUsers;

    // All DB interactions
    try {
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

    // Set up add roles and send DMs
    // console.log(' ---> targetIDs[0]', targetIDs[0]);
    const specialAccessUsers = allUsers.filter(user => targetIDs.indexOf(user.userId) !== -1);
    const IDsNotSignedUp = targetIDs.filter(id => !specialAccessUsers.some(user => user.userId === id));

    const rolePromises = [];
    const specialAccessMessagePromises = [];
    const IDsNotSignedUpMessagePromises = [];
    // Deal with special access users
    for (const specialUser of specialAccessUsers) {
      let member;
      try {
        member = await guild.members.fetch(specialUser.userId);
        rolePromises.push(member.roles.add(accessRole));
        specialAccessMessagePromises.push(member.send(`Good news ${member}, you now have access to the beta! Launch the app on https://simplefi.finance. Your access code is ${specialUser.passCode} \nYou also have access to the private ${feedbackChannel} channel. Please leave your feedback there, it may earn you some rewards  😉 🐳`));
      } catch (error) {
        message.author.send(`There was an error fetching <@${specialUser.userId}>'s data from Discord`);
        console.error(' ---> error fetching user Id', error); // eslint-disable-line no-console
      }
    }

    // Deal with users who haven't yet signed up to the waitlist
    for (const sillyUser of IDsNotSignedUp) {
      let member;
      try {
        member = await guild.members.fetch(sillyUser);
      } catch (error) {
        message.author.send(`There was an error fetching <@${sillyUser}>'s data from Discord`);
        console.error(' ---> error fetching user Id', error); // eslint-disable-line no-console
      }
      errLogChannel.send(`command: special-access \ninternal code: no sign-up issue \nuser: <@${sillyUser}> \nerror message: user needs to sign up to the waitlist before receiving special access \n---`);
      IDsNotSignedUpMessagePromises.push(member.send(`Hi ${member}, I couldn't give you access to the beta because you haven't yet signed up to the waitlist. Please type /waitlist in ${waitlistChannel} and ask the admin to re-send you your access code!`));
    }

    const settledSpecialAccessMessagePromises = await Promise.allSettled(specialAccessMessagePromises);
    const settledRolePromises = await Promise.allSettled(rolePromises);
    const settledIDsNotSignedUpMessagePromises = await Promise.allSettled(IDsNotSignedUpMessagePromises);
    // filters rejects & adds user data (Discordjs errors do not contain user info)
    const rejectedSpecialAccessMessagePromises = filterRejectedPromises(settledSpecialAccessMessagePromises, specialAccessUsers);
    const rejectedRolePromises = filterRejectedPromises(settledRolePromises, specialAccessUsers);
    const rejectedIDsNotSignedUpMessagePromises = filterRejectedPromises(settledIDsNotSignedUpMessagePromises, IDsNotSignedUp);

    // Log DM errors and inform users who didn't receive access DMs
    if (rejectedSpecialAccessMessagePromises.length) {
      console.error(' ---> rejectedSpecialAccessMessagePromises', rejectedSpecialAccessMessagePromises); // eslint-disable-line no-console
      let rejectedUsersMessage = 'Hey ';
      for (const rejectedPromise of rejectedSpecialAccessMessagePromises) {
        errLogChannel.send(`command: special-access \ninternal code: DM issue \nuser: <@${rejectedPromise.user.userId}> \nerror name: ${rejectedPromise.reason.name} \nerror message: ${rejectedPromise.reason.message} \naccess status: user has access - passcode: ${rejectedPromise.user.passCode} \n---`);
        rejectedUsersMessage += `<@${rejectedPromise.user.userId}>, `;
      }
      rejectedUsersMessage = `${rejectedUsersMessage.slice(0, -1)} you now have access to the beta, but I couldn't DM you the access instructions  🥺  \nPlease either allow DMs from this server and type "/waitlist" here again, or get in touch with the team!`;
      waitlistChannel.send(rejectedUsersMessage);
    }

    // Log role errors
    if (rejectedRolePromises.length) {
      console.error(' ---> rejectedRolePromises', rejectedRolePromises); // eslint-disable-line no-console
      for (const rejectedPromise of rejectedRolePromises) {
        errLogChannel.send(`command: special-access \ninternal code: assign role issue \nuser: <@${rejectedPromise.user.userId}> \nerror name: ${rejectedPromise.reason.name} \nerror message: ${rejectedPromise.reason.message} \n---`);
      }
    }

    if (rejectedIDsNotSignedUpMessagePromises.length) {
      console.error(' ---> rejectedIDsNotSignedUpMessagePromises', rejectedIDsNotSignedUpMessagePromises); // eslint-disable-line no-console
      let rejectedIDsMessage = 'Hey ';
      for (const rejectedPromise of rejectedIDsNotSignedUpMessagePromises) {
        errLogChannel.send(`command: special-access \ninternal code: DM issue \nuser: <@${rejectedPromise.user}> \nerror name: ${rejectedPromise.reason.name} \nerror message: ${rejectedPromise.reason.message} \naccess status: user should have access but didn't sign up to the waitlist \n---`);
        rejectedIDsMessage += `<@${rejectedPromise.user}>, `;
      }
      rejectedIDsMessage = `${rejectedIDsMessage.slice(0, -1)} you need to join the waitlist before I can give you access. Just type /waitlist in this channel  🐳  \nPlease also allow DMs from this server so I can send you the access instructions!`;
      waitlistChannel.send(rejectedIDsMessage);
    }
    // conclusion message
    message.author.send(`Access increased for ${specialAccessUsers.length} users out of ${targetIDs.length} requested! \nThere were ${IDsNotSignedUp.length} users not on the waitlist, ${rejectedSpecialAccessMessagePromises.length + rejectedIDsNotSignedUpMessagePromises.length} DM errors and ${rejectedRolePromises.length} role errors.${(IDsNotSignedUp.length || rejectedSpecialAccessMessagePromises.length || rejectedRolePromises.length) ? ' Check the logs channel for details.' : ''}`);
  }
};
