const client = require('../client');

module.exports = async function adminCommandCheck(message) {
  const guild = await client.guilds.cache.get(process.env.GUILD_ID);
  const userIsAdmin = guild.roles.cache.find(r => r.name === process.env.ADMIN_ROLE);
    if (userIsAdmin && message.channel.type === 'DM') {
      return true;
    } else {
      return false;
    }
  }