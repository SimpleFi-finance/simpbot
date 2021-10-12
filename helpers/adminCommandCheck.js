const { admins } = require('../config.json');

module.exports = function adminCommandCheck(message) {
    if (admins.includes(message.author.id) && message.channel.type === 'DM') {
      return true;
    } else {
      return false;
    }
  }