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
- special-access {user IDs seperated by spaces}: gives beta access to arbitrary users
- give-role: will trigger a series of prompts from the bot asking for the target role, user IDs (separate with spaces), channel to post in and an optional thank you message.
- post-message: will trigger prompts to post an arbitrary message in any channel

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
FEEDBACK_CHANNEL = <id of the channel used for leaving feedback>
ERROR_LOGS_CHANNEL = <id of the channel used for logging errors>
FEEDBACK_ROLE = <waitlist role name>
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

## Configure your bot
Create your bot on the [Discord developer portal](https://discord.com/developers/applications) and make sure it's properly configured. See [documentation](https://discord.com/developers/docs/intro).
In the OAuth2 URL Generator, tick
- the following scopes: bot and applications.commands
- the following permissions: Manage Server, Manage Roles, Manage Channels, View Channels, Send Messages, Manage Messages, Read Message History

Add the bot to your Discord server, then run: 
```
node deploy-commands.js
```

## Configure your Discord server
In your Discord server settings, after adding your bot, ensure that the simplefi role is placed above all other roles.
