const { Tags } = require('../db');
const { accessSize } = require('../config.json');
const adminCheck = require('../helpers/adminCommandCheck');

module.exports = {
  name: 'get-list',
	description: 'Get waitlist info',

	async execute(message) {
    if (!adminCheck(message)) {
      message.author.send('Tut tut')
      return;
    }

    try {
      const listSize = await Tags.findAll();
      message.author.send('There are ' + listSize.length + ' people in the list \n and ' + accessSize + ' list members have beta access');
      return;
    }
    catch(err) {
      console.error(err);
    }
	},
};