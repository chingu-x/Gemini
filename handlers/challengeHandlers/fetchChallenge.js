const { airtableTableNameChallenges, base } = require('../airtable.js');

async function fetchChallenges(userRole) {
    try {
        const challengeRecords = await base(airtableTableNameChallenges).select({
            view: 'Main View',
            fields: ['Challenge Name', 'Difficulty', 'Challenge Type', 'Description', 'Role']
        }).firstPage();

        return challengeRecords
            .filter(record => record.fields['Role'] === userRole)
            .map(record => ({
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

module.exports = fetchChallenges;