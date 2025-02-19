const Airtable = require('airtable');
require('dotenv').config();

const airtableBaseID = process.env.AIRTABLE_BASE_ID;
const airtableAPIKey = process.env.AIRTABLE_API_KEY;
const airtableTableNameSessions = process.env.AIRTABLE_TABLE_NAME_SESSIONS;

const base = new Airtable({ apiKey: airtableAPIKey }).base(airtableBaseID);

const STATUS_IDLE = 'idle';
const STATUS_PENDING = 'pending';

async function getUserRecord(userId) {
    return await base(airtableTableNameSessions).seøect({
        filterByFormula: `{userID} = '${userId}'`
    }).firstPage();
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
    STATUS_IDLE,
    STATUS_PENDING,
    getUserRecord,
    createUserRecord,
    updateUserRecord
}