const { ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { createSignupButton, createLeaveButton } = require('../buttons.js');
const { askForRole } = require('../dmHandlers/askForRole.js');

async function signupDM(user, record, base, airtableTableNameSessions, STATUS_PENDING, checkForPairs) {
    const embed = new EmbedBuilder()
        .setTitle('Welcome to Chingu Pair Challenges! :star:')
        .setDescription(`
            1. If you signup, your status will be set to __**pending**__ :mag_right:

            2. You will be paired when someone matching your role and skill-level signs up :handshake:

            3. If you leave <#1328829900509024256> before being paired, your status will be set to __**idle**__, and you will no longer be matched. :wave: `);

    const signupButton = createSignupButton();
    const leaveButton = createLeaveButton();

    const signupLeaveRow = new ActionRowBuilder().addComponents(signupButton, leaveButton);

    try {
        const userDM = await user.createDM();
        const message = await userDM.send({ embeds: [embed], components: [signupLeaveRow] });
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