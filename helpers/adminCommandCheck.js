const client = require('../client');

module.exports = async function adminCommandCheck(message) {
  // console.log(' ---> message from admincheck', message.guild.roles);
  const guild = await client.guilds.cache.get(process.env.GUILD_ID);
  console.log(' ---> guild', guild);
  const userIsAdmin = guild.roles.cache.find(r => r.name === process.env.ADMIN_ROLE);
  // console.log(' ---> userIsAdmin', userIsAdmin);
    if (userIsAdmin && message.channel.type === 'DM') {
      return true;
    } else {
      return false;
    }
  }