const { EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { createBasicButton, createIntermediateButton, createAdvancedButton } = require('../buttons.js');

async function askForDifficulty(user, record, base, airtableTableNameSessions, STATUS_PENDING, checkForPairs, interaction) {
    const difficultyEmbed = new EmbedBuilder()
        .setTitle('Select Your Skill Level')
        .setDescription('Please select your skill level for this pairing session.');

    const basicButton = createBasicButton();
    const intermediateButton = createIntermediateButton();
    const advancedButton = createAdvancedButton();

    const difficultyRow = new ActionRowBuilder().addComponents(basicButton, intermediateButton, advancedButton);

    await interaction.update({ embeds: [difficultyEmbed], components: [difficultyRow] });

    const difficultyCollector = interaction.message.createMessageComponentCollector({ filter: i => i.user.id === user.id, time: 120000 }); // 2 minutes

    difficultyCollector.on('collect', async difficultyInteraction => {
        const selectedDifficulty = difficultyInteraction.customId;
        try {
            await base(airtableTableNameSessions).update(record[0].id, {
                Difficulty: selectedDifficulty,
                Status: STATUS_PENDING
            });
            await difficultyInteraction.update({ content: `You have selected the difficulty: **${selectedDifficulty}**. 🤝You have been signed up for pair programming!🤝`, components: [] });

            // Check for pairs after setting status to pending
            checkForPairs(difficultyInteraction.client);
        } catch (error) {
            if (error.statusCode === 422 && error.error === 'INVALID_MULTIPLE_CHOICE_OPTIONS') {
                console.warn(`Ignoring error: ${error.message}`);
            } else {
                console.error(`Failed to update difficulty for user ${user.tag}:`, error);
            }
        }
    });
}

module.exports = { askForDifficulty };