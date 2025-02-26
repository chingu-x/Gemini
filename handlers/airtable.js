const Airtable = require('airtable');
require('dotenv').config();

const airtableBaseID = process.env.AIRTABLE_BASE_ID;
const airtableAPIKey = process.env.AIRTABLE_API_KEY;
const airtableTableNameSessions = process.env.AIRTABLE_TABLE_NAME_SESSIONS;
const airtableTableNameChallenges = process.env.AIRTABLE_TABLE_NAME_CHALLENGES;

const base = new Airtable({ apiKey: airtableAPIKey }).base(airtableBaseID);

const STATUS_IDLE = 'idle';
const STATUS_PENDING = 'pending';
const STATUS_IN_SESSION = 'in session';

async function getUserRecord(userId) {
    const records = await base(airtableTableNameSessions).select({
        filterByFormula: `{userID} = '${userId}'`
    }).firstPage();

    return records.length > 0 ? records[0] : null;
}

async function createUserRecord(fields) {
    return await base(airtableTableNameSessions).create([{ fields }]);
}

async function updateUserRecord(recordId, fields) {
    return await base(airtableTableNameSessions).update(recordId, fields);
}

module.exports = {
    base,
    airtableTableNameSessions,
    airtableTableNameChallenges,
    STATUS_IDLE,
    STATUS_PENDING,
    STATUS_IN_SESSION,
    getUserRecord,
    createUserRecord,
    updateUserRecord
}