const { Users } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

let accessSize = process.env.ACCESS_SIZE;

module.exports = {
  name: 'get-list',
	description: 'Get waitlist info',

	async execute(message) {
    const userIsAdmin = await adminCheck(message);
    if (!userIsAdmin) {
      message.author.send('Tut tut')
      return;
    }

    try {
      const listSize = await Users.findAll();
      message.author.send('There are ' + listSize.length + ' people in the list \n and ' + accessSize + ' list members have beta access');
      return;
    }
    catch(err) {
      console.error(err);
    }
	},
};