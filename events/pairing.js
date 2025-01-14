const { ChannelType } = require('discord.js');
const Airtable = require('airtable');
const { sendChallenges } = require('./challenge');
require('dotenv').config();

const airtableBaseID = process.env.AIRTABLE_BASE_ID;
const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableTableNameSessions = process.env.AIRTABLE_TABLE_NAME_SESSIONS;
const textChannelID = process.env.TEXT_CHANNEL_ID;
const voiceHubID = process.env.VOICE_HUB;

const base = new Airtable({ apiKey: airtableApiKey }).base(airtableBaseID);

const STATUS_PENDING = 'pending';
const STATUS_IN_SESSION = 'in session';

module.exports = {
    async checkForPairs(client) {
        try {
            console.log('Checking for pairs...');
            // Check Airtable for users with the status of 'pending'
            const records = await base(airtableTableNameSessions).select({
                filterByFormula: `{Status} = '${STATUS_PENDING}'`
            }).all();

            console.log(`Found ${records.length} pending users`);

            // Group users by skill level
            const usersBySkillLevel = records.reduce((acc, record) => {
                const skillLevel = record.fields.Difficulty;
                if (!acc[skillLevel]) {
                    acc[skillLevel] = [];
                }
                acc[skillLevel].push(record);
                return acc;
            }, {});

            // Check for pairs with the same skill level
            for (const skillLevel in usersBySkillLevel) {
                const users = usersBySkillLevel[skillLevel];
                if (users.length >= 2) {
                    // Pair the first two users
                    const [user1, user2] = users;

                    console.log(`Pairing users ${user1.fields['Discord Name']} and ${user2.fields['Discord Name']} with skill level ${skillLevel}`);

                    // Get the existing voice channel
                    const guild = client.guilds.cache.first(); // Assuming the bot is in only one guild
                    const voiceChannel = guild.channels.cache.get(voiceHubID);

                    if (!voiceChannel) {
                        console.error('Voice channel not found');
                        return;
                    }

                    console.log(`Using existing voice channel ${voiceChannel.name}`);

                    // Create a private thread in the specified text channel
                    const textChannel = guild.channels.cache.get(textChannelID);
                    const thread = await textChannel.threads.create({
                        name: `Pair Programming - ${user1.fields['Discord Name']} & ${user2.fields['Discord Name']}`,
                        autoArchiveDuration: 60,
                        type: ChannelType.PrivateThread,
                        invitable: false,
                        reason: 'Pair Programming Session'
                    });

                    console.log(`Created thread ${thread.name}`);

                    // Add users to the private thread
                    await thread.members.add(user1.fields.userID);
                    await thread.members.add(user2.fields.userID);

                    // Send information about the pair programming session in the thread
                    await thread.send(`Welcome to your pair programming session!\n\n**Participants:**
                        \n- <@${user1.fields.userID}>\n- <@${user2.fields.userID}>\n
                        \nIf you're inn need of a voice channel, one of you can just join ${voiceChannel.toString()}. This will be generate a channel for you.
                        \nPlease select a challenge from the dropdown menu below to get started, but please first discuss with eachother which challenge you want to do. As soon as someone selects a challenge, the challenge will be locked in and you can start working on it. Good luck!`);

                    // Update the status of the users in Airtable
                    await base(airtableTableNameSessions).update([
                        { id: user1.id, fields: { Status: STATUS_IN_SESSION } },
                        { id: user2.id, fields: { Status: STATUS_IN_SESSION } }
                    ]);

                    console.log(`Updated status to ${STATUS_IN_SESSION} for users ${user1.fields['Discord Name']} and ${user2.fields['Discord Name']}`);

                    await sendChallenges(thread);

                }
            }
        } catch (error) {
            console.error('Failed to check for pairs:', error);
        }
    }
};