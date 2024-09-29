const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const pairProgHub = "1271183474170269799";

const start = async (client) => {
    try {
        const channelId = pairProgHub;
        const channel = await client.channels.fetch(channelId);

        if (!channel) {
            throw new Error('Channel not found');
        }

        const embed = new EmbedBuilder()
            .setTitle('Welcome to Pair Programming')
            .setDescription('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');

        // Create buttons
        const button1 = new ButtonBuilder()
            .setCustomId('signup')
            .setLabel('Sign Up')
            .setStyle(ButtonStyle.Success);

        const button2 = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('Join')
            .setStyle(ButtonStyle.Success);

        // Condition to determine which button is visible
        const isPending = true;

        const actionRow = new ActionRowBuilder()
            .addComponents(isPending ? button1 : button2);

        await channel.send({ embeds: [embed], components: [actionRow] });
        console.log('Embed message with button sent successfully!');
    } catch (error) {
        console.error('Error sending embed message:', error);
    }
};

module.exports = start;