const {Sequelize, Op} = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.PASSWORD, {
	host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  ssl: true,
  dialectOptions: {
    ssl: true
  }
});

const Users = sequelize.define('users', {
	handle: {
		type: Sequelize.STRING,
		unique: true,
	},
  userId: {
    type: Sequelize.STRING,
    unique: true,
  },
  passCode: {
    type: Sequelize.STRING,
    unique: true,
  },
  useCounter: Sequelize.INTEGER,
  lastAccess: Sequelize.DATE,
  jwt: Sequelize.STRING
});

const Lists = sequelize.define('lists', {
  name: {
    type: Sequelize.STRING,
		unique: true,
  },
  size: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
});

module.exports = {
  Users,
  Lists,
  Op
}