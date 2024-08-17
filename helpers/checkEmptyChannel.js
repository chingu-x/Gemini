const checkEmptyChannel = async (voiceChannel, timeToDelete) => {
  setTimeout(async () => {
    if (voiceChannel.members.size === 0) {
      await voiceChannel.delete();
      delete client.voiceChannels[member.id];
      console.log(`Deleted empty voice channel: ${voiceChannel.name}`);
    } else {
      checkEmptyChannel();
    }
  }, timeToDelete * 1000); // Check every timeToDelete seconds
};

module.exports = checkEmptyChannel;
