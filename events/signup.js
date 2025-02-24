const { base, airtableTableNameSessions, STATUS_IDLE, STATUS_PENDING } = require('../handlers/airtable.js');
const { signupDM } = require('../handlers/dmHandlers/signupDM.js');
const { checkForPairs } = require('../events/pairing.js');
const lobbyVoiceChannelID = process.env.LOBBY_VOICE_CHANNEL_ID;

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const voiceChannelID = lobbyVoiceChannelID;
        
        if (!oldState.channelId && newState.channelId === voiceChannelID) {
            const user = newState.member.user;
            const userId = user.id;

            try {
                // Check if the user has a record in Airtable
                const records = await base(airtableTableNameSessions).select({
                    filterByFormula: `{userID} = '${userId}'`
                }).firstPage();

                if (records.length === 0) {
                    // User is not in the table, create a new record
                    const fields = {
                        userID: userId,
                        'Discord Name': user.tag,
                        Status: STATUS_IDLE
                    };

                    const record = await base(airtableTableNameSessions).create([{ fields }]);

                    // Send DM to ask for signup
                    await signupDM(user, record, base, airtableTableNameSessions, STATUS_PENDING, checkForPairs);
                } else {
                    const userRecord = records[0];
                    // Send DM to ask for signup
                    await signupDM(user, [userRecord], base, airtableTableNameSessions, STATUS_PENDING, checkForPairs);
                }
            } catch (error) {
                console.error(`Failed to process user ${user.tag}:`, error);
            }
        } else if (oldState.channelId === voiceChannelID && !newState.channelId) {
            // If the user leaves the lobby channel without 'in session' session status, update the status to 'idle'.
            const user = oldState.member.user;
            const userId = user.id;

            try {
                // Check if the user has a record in Airtable
                const records = await base(airtableTableNameSessions).select({
                    filterByFormula: `{userID} = '${userId}'`
                }).firstPage();

                if (records.length > 0 && records[0].fields.Status === STATUS_PENDING) {
                    await base(airtableTableNameSessions).update(records[0].id, {
                        Status: STATUS_IDLE
                    });
                    console.log(`Status for ${user.tag} (${user.id}) was updated to ${STATUS_IDLE} because they left the lobby channel without being paired.`);
                }
            } catch (error) {
                console.error(`Failed to update status to ${STATUS_IDLE} for user ${user.tag}:`, error);
            }
        }
    }
};