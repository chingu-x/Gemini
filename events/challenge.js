const { EmbedBuilder } = require('discord.js');
const Airtable = require('airtable');
require('dotenv').config();

const airtableBaseID = process.env.AIRTABLE_BASE_ID;
const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableTableNameChallanges = process.env.AIRTABLE_TABLE_NAME_CHALLENGES;

module.exports = {
    async askForDifficulty(thread, content) {
        try {
            const records = await base(airtableTableNameChallanges).select().all();


            const embed = new EmbedBuilder()
                .setTitle('Difficulty Level')
                .setDescription(content)

            await thread.send({ embeds: [embed] });
            console.log('Sent difficulty level message');
        } catch (error) {
            console.error('Failed to ask for difficulty level:', error);
        }
    }
};