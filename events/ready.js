const { Users, Lists } = require('../db');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
    // use { force: true } as a sync option to drop and recreate table on start
    await Users.sync();
    await Lists.sync();
		console.log(`Ready! Logged in as ${client.user.tag}`);
    const waitlist = await Lists.findOne({ where: { name: process.env.WAITLIST_NAME } });
    if (!waitlist) {
      try {
        const newWaitlist = await Lists.create({
          name: process.env.WAITLIST_NAME,
          size: Number(process.env.ACCESS_SIZE)
        });
        console.log(`${newWaitlist.dataValues.name} has been created with initial size ${newWaitlist.dataValues.size}`);

      } catch (err) {
        console.error('Waitlist initialisation error: ', err);
      }
    } else {
      console.log(`${waitlist.dataValues.name} exists and has initial size ${waitlist.dataValues.size}`);
    }
	},
};