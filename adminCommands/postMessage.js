const client = require('../client');
const adminCheck = require('../helpers/adminCommandCheck');

module.exports = {
  name: 'post-message',
  description: 'Post a one-off message to any channel',

  // Admin check
  async execute(message) {
    if (!adminCheck(message)) {
      return;
    }
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const filter = r => r.author === message.author ? true : false; // eslint-disable-line no-confusing-arrow
    let targetChannel;

    try {
      await message.reply('Channel to post in?', { fetchReply: true });
      const channelCollector = message.channel.createMessageCollector({ filter, max: 1, time: 90000, errors: ['time'] });

      channelCollector.on('collect', async channelReply => {
        targetChannel = client.channels.cache.get(channelReply.content);
        if (!targetChannel) {
          message.author.send(`Sorry, something went wrong finding the ${channelReply.content} channel. Try again  😞`);
          return;
        }
        const permissionToPostInChannel = guild.me.permissionsIn(targetChannel).has('SEND_MESSAGES');
        const addedToChannel = targetChannel.members.get(guild.me.id) ? true : false;
        if (!permissionToPostInChannel || !addedToChannel) {
          message.author.send(`I either don't have permission to post in that channel or I haven't been added to it, sorry  😞  Please give me access and try again!`);
          return;
        }
        await channelReply.reply('Message?');
        const msgCollector = message.channel.createMessageCollector({ filter, max: 1, time: 90000, errors: ['time'] });

        msgCollector.on('collect', async msgReply => {
          await targetChannel.send(msgReply.content);
          msgReply.reply('Done!');
        });
      });
    } catch (error) {
      console.error('Give role error', error); // eslint-disable-line no-console
      message.author.send('Sorry, something went wrong. Try again');
    }
  }
};
