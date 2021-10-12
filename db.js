const {Sequelize, Op} = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.PASSWORD, {
	host: process.env.DB_HOST,
	dialect: process.env.DB_DIALECT,
	storage: process.env.DB_STORAGE
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