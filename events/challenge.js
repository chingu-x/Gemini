const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Airtable = require('airtable');
require('dotenv').config();

const airtableBaseID = process.env.AIRTABLE_BASE_ID;
const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableTableNameChallenges = process.env.AIRTABLE_TABLE_NAME_CHALLENGES;

const base = new Airtable({ apiKey: airtableApiKey }).base(airtableBaseID);

const DIFFICULTY_ORDER = {
    Basic: 1,
    Intermediate: 2,
    Advanced: 3
};

async function fetchChallenges() {
    try {
        const challengeRecords = await base(airtableTableNameChallenges).select({
            view: 'Main View',
            fields: ['Challenge Name', 'Difficulty', 'Challenge Type', 'Description']
        }).firstPage();

        return challengeRecords.map(record => ({
            id: record.id,
            name: record.fields['Challenge Name'],
            type: record.fields['Challenge Type'],
            difficulty: record.fields['Difficulty'],
            description: record.fields['Description']
        }));
    } catch (error) {
        console.error('Failed to fetch challenges from Airtable:', error);
        throw error;
    }
}

async function sendChallenges(thread) {
    try {
        const challenges = await fetchChallenges();

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

        await thread.send({ embeds: [embed], components: [row] });
        console.log('Sent challenges list message with dropdown menu');
    } catch (error) {
        console.error('Failed to send challenges list message:', error);
    }
}

async function handleChallengeSelection(interaction) {
    try {
        const challengeId = interaction.values[0];
        console.log(`Challenge selected: ${challengeId}`);
        
        const challenges = await fetchChallenges();
        const selectedChallenge = challenges.find(challenge => challenge.id === challengeId);

        if (selectedChallenge) {
            const embed = new EmbedBuilder()
                .setTitle(selectedChallenge.name)
                .setDescription(selectedChallenge.description || 'No description available')
                .addFields(
                    { name: 'Type', value: selectedChallenge.type || 'Unknown Type', inline: true },
                    { name: 'Difficulty', value: selectedChallenge.difficulty || 'Unknown Difficulty', inline: true }
                );

            await interaction.update({ embeds: [embed], components: [] });
            console.log(`Displayed description for challenge: ${selectedChallenge.name}`);
        } else {
            await interaction.update({ content: 'Challenge not found', components: [] });
            console.log('Challenge not found');
        }
    } catch (error) {
        console.error('Failed to handle challenge selection:', error);
    }
}

module.exports = {
    fetchChallenges,
    sendChallenges,
    handleChallengeSelection
};