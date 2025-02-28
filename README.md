# Parity

#### Parity is a discord bot made for Chingu Pair Challenges
___

#### How to run
1. `npm install` to install dependencies 
2. Set up environment variables:
    * Create an `.env` file in the root directory of your project.
    * Add the following environment variables to `.env` file:<br>
    Token and Client ID can be found in the [Discord Developer Portal](https://discord.com/developers/)<br>
    `DISCORD_TOKEN = <your-discord-token>`<br>
    `CLIENT_ID = <your-client-id>`<br>
    `GUILD_ID = <your-server-id>`<br>
    `LOBBY_VOICE_CHANNEL_ID = <your-lobby-voice-channel-id>`<br>
    `VOICE_HUB = <your-voice-hub-id>`<br>
    `TEXT_CHANNEL_ID = <your-text-channel-id>`<br>
    `AIRTABLE_BASE_ID = <your-airtable-base-id>`<br>
    `AIRTABLE_API_KEY = <your-airtable-api-key>`<br>
    `AIRTABLE_TABLE_NAME_SESSIONS = <your-airtable-table-name-sessions>`<br>
    `AIRTABLE_TABLE_NAME_CHALLENGES = <your-airtable-table-name-challenges>`<br>
    `DEVELOPER_ROLE_ID = <your-developer-role-id>`<br>
    `DATA_SCIENTIST_ROLE_ID = <your-data-scientist-role-id>`<br>
    `UI_UX_DESIGNER_ROLE_ID = <your-ui-ux-designer-role-id>`<br>
    `SCRUM_MASTER_ROLE_ID = <your-scrum-master-role-id>`<br>
    `PRODUCT_OWNER_ROLE_ID = <your-product-owner-role-id>`<br>
3. `node index.js` to run the bot
4. When new commands are added, run `node deploy-commands.js.` This will update the server with the new changes. Only needed regarding commands. As of right now, this bot has no commands, so it's not neccessary to use. 
#### Dev server
1. `npm run dev` to start development server

#### Dependencies
* airtable - ^0.12.2
* discord.js - ^14.15.3
* dotenv - ^16.4.5

#### Dev Dependencies
* nodemon - ^3.1.4

### Development
#### Branch naming
* lowercase and hyphen inplace of space. For example `feature/discord-bot`
* Only alphanumeric characters, dont use period, space, underscores etc. and dont use multiple hyphens after another, or trailing hyphens.

1. `feature/` for all features.
2. `bugfix/` for all bugfixes.
3. `hotfix/` for all quick emergency fixes.
4. `docs/` for udates to documentation.
5. `refactor/` for refactoring.

#### Commit messages
* all commit messages should be short (50 characters or less), but descriptive. Example `feat: add admin dashboard ` The description should also be what the commit does, not what you did. Notice the example above said `add` not `added`
* We use the following prefixes:
  * `feat:` for features
  * `fix:` for bugfixes and hotfixes
  * `docs:` for ducumentaion
  * `refactor:` for refactoring