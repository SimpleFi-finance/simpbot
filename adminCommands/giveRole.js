const client = require('../client');
const adminCheck = require('../helpers/adminCommandCheck');

module.exports = {
  name: 'give-role',
  description: 'Give beta access to arbitrary accounts',

  // Admin check
  async execute(message) {
    if (!adminCheck(message)) {
      return;
    }
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const filter = r => r.author === message.author ? true : false; // eslint-disable-line no-confusing-arrow
    const roleArguments = {};

    try {
      await message.reply('Role?', { fetchReply: true });
      const roleCollector = message.channel.createMessageCollector({ filter, max: 1, time: 90000, errors: ['time'] });

      roleCollector.on('collect', async roleReply => {
        roleArguments.role = guild.roles.cache.find(r => r.name === roleReply.content);
        if (!roleArguments.role) {
          message.author.send(`Sorry, something went wrong finding the ${roleReply.content} role. Try again  😞`);
          return;
        }
        await roleReply.reply('User IDs?');
        const IDCollector = message.channel.createMessageCollector({ filter, max: 1, time: 90000, errors: ['time'] });

        // Separate user IDs with spaces
        IDCollector.on('collect', async IDReply => {
          roleArguments.userIDs = IDReply.content.split(' ');
          roleArguments.targetMembers = [];
          for (const userID of roleArguments.userIDs) {
            try {
              const targetMember = await guild.members.fetch(userID);
              roleArguments.targetMembers.push(targetMember);
            } catch (error) {
              console.error('Fetch ID error', error); // eslint-disable-line no-console
              message.author.send(`Sorry, something went wrong fetching the user ID for <@${userID}>. Try again  😞`);
              return;
            }
          }
          await IDReply.reply('Channel to post in?');
          const channelCollector = message.channel.createMessageCollector({ filter, max: 1, time: 90000, errors: ['time'] });

          channelCollector.on('collect', async channelReply => {
            roleArguments.targetChannel = client.channels.cache.get(channelReply.content);
            const permissionToPostInChannel = guild.me.permissionsIn(roleArguments.targetChannel).has('SEND_MESSAGES');

            if (!roleArguments.targetChannel) {
              message.author.send(`Sorry, something went wrong finding the ${channelReply.content} channel. Try again  😞`);
              return;
            }
            if (!permissionToPostInChannel) {
              message.author.send(`I don't have the permission to post in that channel, sorry  😞  Please give me access and try again!`);
              return;
            }
            await IDReply.reply('Thanks message?');
            const thanksMsgCollector = message.channel.createMessageCollector({ filter, max: 1, time: 90000, errors: ['time'] });

            thanksMsgCollector.on('collect', async thanksMsgReply => {
              roleArguments.roleMessage = thanksMsgReply.content;

              for (const member of roleArguments.targetMembers) {
                try {
                  await member.roles.add(roleArguments.role);
                } catch (error) {
                  console.error('Add role error', error); // eslint-disable-line no-console
                  message.author.send(`Sorry, something went wrong adding the role to ${member}>. Bummer  😞`);
                }
              }
              roleArguments.userIDs = roleArguments.userIDs.join('>, <@');
              await roleArguments.targetChannel.send(`Hi <@${roleArguments.userIDs}> you've just been given the ${roleArguments.role} role! ${roleArguments.roleMessage}`);
              thanksMsgReply.reply('Done!');
            });
          });
        });
      });
    } catch (error) {
      console.error('Give role error', error); // eslint-disable-line no-console
      message.author.send('Sorry, something went wrong. Try again');
    }
  }
};
