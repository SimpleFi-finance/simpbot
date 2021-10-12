const { Users, Op } = require('../db');
const adminCheck = require('../helpers/adminCommandCheck');

let accessSize = process.env.ACCESS_SIZE;

module.exports = {
  name: 'batch-increase',
	description: 'Increase access list size',

	async execute(message, newAccessSize) {
    if (!adminCheck(message)) {
      message.author.send('Tut tut')
      return;
    }

    try {
      newAccessSize = parseInt(newAccessSize);
      if (newAccessSize <= accessSize) {
        message.author.send(`You can only increase the access list. Currently it is ${accessSize}`);
        return;
      }

      const newUsers = await Users.findAll({
        where: {
          id: {
            [Op.between]: [accessSize +1, newAccessSize]
          }
        }
      });

      //add for loop to fetch users and send them their passcode.
      // change access size in json;


    } catch(err) {
      console.error(err);
    }
	},
};