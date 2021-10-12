const { Users } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

let accessSize = process.env.ACCESS_SIZE;

module.exports = {
  name: 'get-waitlist',
	description: 'Get waitlist info',

	async execute(message) {
    const userIsAdmin = await adminCheck(message);
    if (!userIsAdmin) {
      message.author.send('Tut tut')
      return;
    }

    try {
      const listSize = await Users.findAll();
      message.author.send('There are ' + listSize.length + ' people in the list \n and the access size is ' + accessSize);
      return;
    }
    catch(err) {
      console.error(err);
    }
	},
};