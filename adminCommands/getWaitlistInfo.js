const { Users, Lists } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

module.exports = {
  name: 'get-waitlist',
  description: 'Get waitlist info',

  async execute(message) {
    const userIsAdmin = await adminCheck(message);
    if (!userIsAdmin) {
      message.author.send('Tut tut');
      return;
    }

    try {
      const waitlist = await Lists.findOne({ where: { name: process.env.WAITLIST_NAME } });
      const usersInlist = await Users.findAll();
      message.author.send(`There are ${usersInlist.length} people in the list \n and the access size is ${waitlist.dataValues.size}`);
      return;
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
    }
  }
};
