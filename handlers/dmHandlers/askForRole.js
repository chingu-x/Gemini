const { EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { createDeveloperButton, createAgileLeaderButton } = require('../buttons.js');
const { askForDifficulty } = require('../dmHandlers/askForDifficulty.js');

async function askForRole(user, record, base, airtableTableNameSessions, STATUS_PENDING, checkForPairs, interaction) {
    const roleEmbed = new EmbedBuilder()
        .setTitle('Select Your Role')
        .setDescription('Please select the role you want to be assigned for this pairing session.');

    const developerButton = createDeveloperButton();
    const agileLeaderButton = createAgileLeaderButton();

    const roleRow = new ActionRowBuilder().addComponents(developerButton, agileLeaderButton);

    await interaction.update({ embeds: [roleEmbed], components: [roleRow] });

    const roleCollector = interaction.message.createMessageComponentCollector({ filter: i => i.user.id === user.id, time: 120000 }); // 2 minutes

    roleCollector.on('collect', async roleInteraction => {
        const selectedRole = roleInteraction.customId;
        try {
            await base(airtableTableNameSessions).update(record[0].id, {
                Role: selectedRole
            });
            await askForDifficulty(user, record, base, airtableTableNameSessions, STATUS_PENDING, checkForPairs, roleInteraction);
        } catch (error) {
            console.error(`Failed to update role for user ${user.tag}:`, error);
        }
    });
}

module.exports = { askForRole };