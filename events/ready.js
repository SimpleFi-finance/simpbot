const { Users, Lists } = require('../db');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    // use { force: true } as a sync option to drop and recreate table on start - useful for testing
    await Users.sync();
    await Lists.sync();
    console.log(`Ready! Logged in as ${client.user.tag}`); // eslint-disable-line no-console
    const waitlist = await Lists.findOne({ where: { name: process.env.WAITLIST_NAME } });
    if (!waitlist) {
      try {
        const newWaitlist = await Lists.create({
          name: process.env.WAITLIST_NAME,
          size: Number(process.env.ACCESS_SIZE)
        });
        console.log(`${newWaitlist.dataValues.name} has been created with initial size ${newWaitlist.dataValues.size}`); // eslint-disable-line no-console
      } catch (err) {
        console.error('Waitlist initialisation error: ', err); // eslint-disable-line no-console
      }
    } else {
      console.log(`${waitlist.dataValues.name} exists and has initial size ${waitlist.dataValues.size}`); // eslint-disable-line no-console
    }

    // start cronjob to monitor subgraphs health
    const alerter = require(`../subgraph-ops/ops-alert`);
    await alerter.startSubgraphHealthTracker();
    console.log("Alerter started");
  },
};
