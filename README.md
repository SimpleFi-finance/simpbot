## About

A community management bot for the SimpleFi Discord server, starting with managing access for beta testers.

## Installation
```
npm install
```

## Start
```
npm start
```
or
```
node index.js
```
## Waitlist use
Users simply use the /waitlist commmand in the dedicated channel to be added to the waitlist

Admin controls (prepend admin prefix):
- get-waitlist: get info on the current state of the waiting list
- increase-beta {number}: increases the size of the beta access list and notifies users of their access codes

## Register slash commands
Make sure to have your bot properly configured. See [documentation](https://discord.com/developers/docs/intro).
Then run: 
```
node deploy-commands.js
```

## Environment
Create a .env file with the following information:
```
#connection to Discord
TOKEN = <your Discord bot token>
CLIENT_ID = <your Discord application id>
GUILD_ID = <your Discord server id>

#app variables
ADMIN_PREFIX = <prefix for admin messages to simpbot>
WAITLIST_CHANNEL = <id of the channel used for joining the waitlist>
ADMIN_ROLE = <Discord role authorised to use admin commands>
ACCESS_SIZE = <initial size of access list>

#db variables (Sequelize)
DB_NAME = <db name>
DB_USER = <username>
DB_PASSWORD = <password>
DB_HOST = <localhost or host url>
DB_DIALECT	= <e.g. sqlite>
DB_STORAGE = <storage>
WAITLIST_NAME = <name of your waitlist db for querying access size>
```