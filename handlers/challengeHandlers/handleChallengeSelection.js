const { EmbedBuilder } = require('discord.js');

async function handleChallengeSelection(interaction, challenges) {
    try {
        if (!challenges) {
            console.error('Challenges array is undefined');
            await interaction.update({ content: 'Challenges array is undefined', components: [] });
            return;
        }

        const challengeId = interaction.values[0];

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

module.exports = handleChallengeSelection;