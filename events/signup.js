const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { sendSkillLevelDM } = require('../handlers/dm');
const { base, airtableTableNameSessions, STATUS_IDLE, STATUS_PENDING } = require('../handlers/airtable');
const { DEVELOPER_ROLE_ID, DATA_SCIENTIST_ROLE_ID, UI_UX_DESIGNER_ROLE_ID, SCRUM_MASTER_ROLE_ID, PRODUCT_OWNER_ROLE_ID } = require('../handlers/roles');
const { checkForPairs } = require('../events/pairing.js');

const lobbyVoiceChannelID = process.env.LOBBY_VOICE_CHANNEL_ID;

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const voiceChannelID = lobbyVoiceChannelID;
        
        if (!oldState.channelId && newState.channelId === voiceChannelID) {
            const user = newState.member.user;
            const userId = user.id;
            const member = newState.member;

            try {
                // Check if the user has a record in Airtable
                const records = await base(airtableTableNameSessions).select({
                    filterByFormula: `{userID} = '${userId}'`
                }).firstPage();

                if (records.length === 0) {
                    // User is not in the table, create a new record
                    const fields = {
                        userID: userId,
                        'Discord Name': user.tag,
                        Status: STATUS_IDLE
                    };

                    // Check for roles and assign in Airtable
                    if (member.roles.cache.has(DEVELOPER_ROLE_ID)) {
                        fields.Role = 'Developer';
                    } else if (member.roles.cache.has(DATA_SCIENTIST_ROLE_ID)) {
                        fields.Role = 'Developer';
                    } else if (member.roles.cache.has(UI_UX_DESIGNER_ROLE_ID)) {
                        fields.Role = 'Designer';
                    } else if (member.roles.cache.has(SCRUM_MASTER_ROLE_ID)) {
                        fields.Role = 'Scrum Master';
                    } else if (member.roles.cache.has(PRODUCT_OWNER_ROLE_ID)) {
                        fields.Role = 'Product Owner';
                    }

                    const record = await base(airtableTableNameSessions).create([{ fields }]);

                    // Send DM to ask for skill level
                    await sendSkillLevelDM(user, record, base, airtableTableNameSessions, STATUS_IDLE, STATUS_PENDING, checkForPairs);
                } else {
                    const userRecord = records[0];
                    const userSkillLevel = userRecord.fields.Difficulty;

                    if (!userSkillLevel) {
                        // User has no skill level assigned, ask for skill level
                        await sendSkillLevelDM(user, [userRecord], base, airtableTableNameSessions, STATUS_IDLE, STATUS_PENDING, checkForPairs);
                    } else {
                        // User is already in the table and has a skill level assigned
                        const embed = new EmbedBuilder()
                            .setTitle('Welcome to Chingu Pair Programming!')
                            .setDescription('Do you want to sign up for pair programming?');

                        const yesButton = new ButtonBuilder()
                            .setCustomId('yes')
                            .setLabel('Yes')
                            .setStyle(ButtonStyle.Primary);

                        const noButton = new ButtonBuilder()
                            .setCustomId('no')
                            .setLabel('No')
                            .setStyle(ButtonStyle.Danger);

                        const row = new ActionRowBuilder().addComponents(yesButton, noButton);

                        try {
                            const userDM = await user.createDM();
                            const message = await userDM.send({ embeds: [embed], components: [row] });
                            console.log(`DM sent to user ${user.tag}`);

                            const filter = i => i.user.id === user.id;
                            const collector = message.createMessageComponentCollector({ filter, time: 120000 }); // 2 minutes

                            collector.on('collect', async interaction => {
                                if (interaction.customId === 'yes') {
                                    try {
                                        await base(airtableTableNameSessions).update(userRecord.id, {
                                            Status: STATUS_PENDING
                                        });
                                        await interaction.update({ content: '🤝You have been signed up for pair programming!🤝', components: [] });

                                        // Check for pairs after setting status to pending
                                        checkForPairs(interaction.client);
                                    } catch (error) {
                                        console.error(`Failed to update status to ${STATUS_PENDING} for user ${user.tag}:`, error);
                                    }
                                } else if (interaction.customId === 'no') {
                                    await interaction.update({ content: 'Session terminated.', components: [] });
                                }
                            });
                        } catch (error) {
                            console.error(`Failed to send DM to user ${user.tag}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to process user ${user.tag}:`, error);
            }
        } else if (oldState.channelId === voiceChannelID && !newState.channelId) {
            // If the user leaves the lobby channel without 'in session' session status, update the status to 'idle'.
            const user = oldState.member.user;
            const userId = user.id;

            try {
                // Check if the user has a record in Airtable
                const records = await base(airtableTableNameSessions).select({
                    filterByFormula: `{userID} = '${userId}'`
                }).firstPage();

                if (records.length > 0 && records[0].fields.Status === STATUS_PENDING) {
                    await base(airtableTableNameSessions).update(records[0].id, {
                        Status: STATUS_IDLE
                    });
                    console.log(`Status for ${user.tag} (${user.id}) was updated to ${STATUS_IDLE} because they left the lobby channel without being paired.`);
                }
            } catch (error) {
                console.error(`Failed to update status to ${STATUS_IDLE} for user ${user.tag}:`, error);
            }
        }
    }
};