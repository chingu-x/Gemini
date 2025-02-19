const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');

async function sendSkillLevelDM(user, record, base, airtableTableNameSessions, STATUS_IDLE, STATUS_PENDING, checkForPairs) {
    const embed = new EmbedBuilder()
        .setTitle('Welcome to Chingu Pair Programming!')
        .setDescription('Please select your skill level. This will help us pair you with someone of a similar skill level.');

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_skill')
        .setPlaceholder('Select a skill level')
        .addOptions([
            { label: 'Basic', value: 'Basic' },
            // { label: 'Intermediate', value: 'Intermediate' },
            // { label: 'Advanced', value: 'Advanced' },
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
                                await followUpInteraction.update({ content: '🤝You have been signed up for pair programming!🤝', components: [] });

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
}

module.exports = {
    sendSkillLevelDM
};