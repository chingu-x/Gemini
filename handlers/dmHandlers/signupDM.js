const { ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { createYesButton, createNoButton } = require('../buttons.js');
const { askForRole } = require('../dmHandlers/askForRole.js');

async function signupDM(user, record, base, airtableTableNameSessions, STATUS_PENDING, checkForPairs) {
    const embed = new EmbedBuilder()
        .setTitle('Welcome to Chingu Pair Programming!')
        .setDescription('Do you want to sign up for pair programming?');

    const yesButton = createYesButton();
    const noButton = createNoButton();

    const yesNoRow = new ActionRowBuilder().addComponents(yesButton, noButton);

    try {
        const userDM = await user.createDM();
        const message = await userDM.send({ embeds: [embed], components: [yesNoRow] });
        console.log(`DM sent to user ${user.tag}`);

        const filter = i => i.user.id === user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 120000 }); // 2 minutes

        collector.on('collect', async interaction => {
            if (interaction.customId === 'yes') {
                await askForRole(user, record, base, airtableTableNameSessions, STATUS_PENDING, checkForPairs, interaction);
            } else if (interaction.customId === 'no') {
                await interaction.update({ content: 'Session terminated.', components: [] });
            }
        });
    } catch (error) {
        console.error(`Failed to send DM to user ${user.tag}:`, error);
    }
}

module.exports = { signupDM };