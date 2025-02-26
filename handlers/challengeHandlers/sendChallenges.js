const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fetchChallenges = require('./fetchChallenge.js');
const { getUserRecord } = require('../airtable.js');

const DIFFICULTY_ORDER = {
    Basic: 1,
    Intermediate: 2,
    Advanced: 3
};

async function sendChallenges(thread, userId) {
    try {
        const userRecord = await getUserRecord(userId);

        if (!userRecord) {
            await thread.send('No user record found.');
            console.log('No user record found.');
            return;
        }

        const userRole = userRecord.fields['Role'];

        if (!userRole) {
            await thread.send('No role found for your user.');
            console.log('No role found for the user.');
            return;
        }

        const challenges = await fetchChallenges(userRole);

        if (challenges.length === 0) {
            await thread.send('No challenges available for your role.');
            console.log('No challenges available for the user role.');
            return;
        }

        if (challenges.length > 25) {
            await thread.send('Too many challenges available. Please refine your role or criteria.');
            console.log('Too many challenges available.');
            return;
        }

        // Sort challenges first by difficulty and then alphabetically by name
        challenges.sort((a, b) => {
            if (DIFFICULTY_ORDER[a.difficulty] !== DIFFICULTY_ORDER[b.difficulty]) {
                return DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
            }
            return a.name.localeCompare(b.name);
        });

        // Create an embed message with the list of challenges in a table-like structure
        const embed = new EmbedBuilder()
            .setTitle('Available Challenges')
            .setDescription('Here are the available challenges:')
            .addFields(
                { name: 'Challenge Name', value: challenges.map(challenge => challenge.name || 'Unnamed Challenge').join('\n'), inline: true },
                { name: 'Type', value: challenges.map(challenge => challenge.type || 'Unknown Type').join('\n'), inline: true },
                { name: 'Difficulty', value: challenges.map(challenge => challenge.difficulty || 'Unknown Difficulty').join('\n'), inline: true }
            );

        // Create a dropdown menu with the challenge names
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_challenge')
            .setPlaceholder('Select a challenge')
            .addOptions(challenges.map(challenge => ({
                label: challenge.name,
                value: challenge.id
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Send the embed message with the dropdown menu
        await thread.send({ embeds: [embed], components: [row] });

        return challenges;
    } catch (error) {
        console.error('Failed to send challenges list message:', error);
    }
}

module.exports = sendChallenges;