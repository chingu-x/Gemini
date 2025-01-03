const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const Airtable = require('airtable');
require('dotenv').config();
const { checkForPairs } = require('./pairing.js');

const lobbyVoiceChannelID = process.env.LOBBY_VOICE_CHANNEL_ID;
const airtableBaseID = process.env.AIRTABLE_BASE_ID;
const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableTableNameSessions = process.env.AIRTABLE_TABLE_NAME_SESSIONS;

const base = new Airtable({ apiKey: airtableApiKey }).base(airtableBaseID);

const STATUS_IDLE = 'idle';
const STATUS_PENDING = 'pending';

module.exports = {
    name: 'signup',
    async execute(oldState, newState) {
        const voiceChannelID = lobbyVoiceChannelID;
        
        if (!oldState.channelId && newState.channelId === voiceChannelID) {
            const user = newState.member.user;
            const userId = user.id;

            try {
                // Check if the user has a record in Airtable
                const records = await base(airtableTableNameSessions).select({
                    filterByFormula: `{userID} = '${userId}'`
                }).firstPage();

                if (records.length === 0) {
                    // User is not in the table, create a new record
                    const record = await base(airtableTableNameSessions).create([
                        {
                            fields: {
                                userID: userId,
                                'Discord Name': user.tag,
                                Status: STATUS_IDLE
                            }
                        }
                    ]);

                    // Send DM to ask for skill level
                    const embed = new EmbedBuilder()
                        .setTitle('Pair Programming')
                        .setDescription('Please select your skill level.');

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('select_skill')
                        .setPlaceholder('Select a skill level')
                        .addOptions([
                            { label: 'Basic', value: 'Basic' },
                            { label: 'Intermediate', value: 'Intermediate' },
                            { label: 'Advanced', value: 'Advanced' },
                        ]);

                    const row = new ActionRowBuilder().addComponents(selectMenu);

                    try {
                        const userDM = await user.createDM();
                        const message = await userDM.send({ embeds: [embed], components: [row] });
                        console.log(`DM sent to user ${user.tag}`);

                        const filter = i => i.user.id === user.id;
                        const collector = message.createMessageComponentCollector({ filter, time: 120000 }); // 2 minutes

                        collector.on('collect', async interaction => {
                            if (interaction.customId === 'select_skill') {
                                const skillLevel = interaction.values[0];
                                try {
                                    await base(airtableTableNameSessions).update(record[0].id, {
                                        Difficulty: skillLevel,
                                        Status: STATUS_IDLE
                                    });

                                    await interaction.update({ content: `You selected: **${skillLevel}**. Do you want to sign up for pair programming?`, components: [] });

                                    const yesButton = new ButtonBuilder()
                                        .setCustomId('yes')
                                        .setLabel('Yes')
                                        .setStyle(ButtonStyle.Primary);

                                    const noButton = new ButtonBuilder()
                                        .setCustomId('no')
                                        .setLabel('No')
                                        .setStyle(ButtonStyle.Danger);

                                    const row2 = new ActionRowBuilder().addComponents(yesButton, noButton);
                                    const followUpMessage = await userDM.send({ content: 'Do you want to sign up for pair programming?', components: [row2] });

                                    const followUpCollector = followUpMessage.createMessageComponentCollector({ filter, time: 120000 }); // 2 minutes

                                    followUpCollector.on('collect', async followUpInteraction => {
                                        if (followUpInteraction.customId === 'yes') {
                                            try {
                                                await base(airtableTableNameSessions).update(record[0].id, {
                                                    Status: STATUS_PENDING
                                                });
                                                await followUpInteraction.update({ content: 'You have been signed up for pair programming!', components: [] });

                                                // Check for pairs after setting status to pending
                                                checkForPairs(interaction.client);
                                            } catch (error) {
                                                console.error(`Failed to update status to ${STATUS_PENDING} for user ${user.tag}:`, error);
                                            }
                                        } else if (followUpInteraction.customId === 'no') {
                                            await followUpInteraction.update({ content: 'Session terminated.', components: [] });
                                        }
                                    });
                                } catch (error) {
                                    console.error(`Failed to update skill level for user ${user.tag}:`, error);
                                }
                            }
                        });
                    } catch (error) {
                        console.error(`Failed to send DM to user ${user.tag}:`, error);
                    }
                } else {
                    // User is already in the table
                    const embed = new EmbedBuilder()
                        .setTitle('Pair Programming')
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
                                    await base(airtableTableNameSessions).update(records[0].id, {
                                        Status: STATUS_PENDING
                                    });
                                    await interaction.update({ content: 'You have been signed up for pair programming!', components: [] });

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