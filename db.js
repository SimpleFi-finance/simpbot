const {Sequelize, Op} = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	storage: 'database.sqlite',
});

const Tags = sequelize.define('tags', {
	handle: {
		type: Sequelize.STRING,
		unique: true,
	},
  userId: {
    type: Sequelize.STRING,
    unique: true,
  },
	passcode: Sequelize.STRING,
});

module.exports = {
  Tags,
  Op
}