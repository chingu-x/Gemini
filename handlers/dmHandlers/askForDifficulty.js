const { EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { createBasicButton, createIntermediateButton } = require('../buttons.js');

async function askForDifficulty(user, record, base, airtableTableNameSessions, STATUS_PENDING, checkForPairs, interaction) {
    const difficultyEmbed = new EmbedBuilder()
        .setTitle('Which difficulty level are you comfortable with? :signal_strength:')
        .setDescription('Please select the desired difficulty level for this pairing session.');

    const basicButton = createBasicButton();
    const intermediateButton = createIntermediateButton();
    // const advancedButton = createAdvancedButton();

    const difficultyRow = new ActionRowBuilder().addComponents(basicButton, intermediateButton);

    await interaction.update({ embeds: [difficultyEmbed], components: [difficultyRow] });

    const difficultyCollector = interaction.message.createMessageComponentCollector({ filter: i => i.user.id === user.id, time: 120000 }); // 2 minutes

    difficultyCollector.on('collect', async difficultyInteraction => {
        const selectedDifficulty = difficultyInteraction.customId;
        try {
            await base(airtableTableNameSessions).update(record[0].id, {
                Difficulty: selectedDifficulty,
                Status: STATUS_PENDING
            });
            await difficultyInteraction.update({ 
                content: `
                ## 🤝You are now signed up for Chingu Pair Challenge!🤝
                * Remember that if you leave <#1328829900509024256>, matchmaking will end for you`,
                components: [],
                embeds: []
            });

            // Check for pairs after setting status to pending
            checkForPairs(difficultyInteraction.client);
        } catch (error) {
                console.error(`Failed to update difficulty for user ${user.tag}:`, error);  
        }
    });
}

module.exports = { askForDifficulty };