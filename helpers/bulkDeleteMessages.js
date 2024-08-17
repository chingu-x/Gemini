const bulkDeleteMessages = async (channelId, client, nMessages = 10) => {
  if (!channelId) {
    console.error("Deleting messages requires a channel ID.");
    return;
  }

  const channel = client.channels.cache.get(channelId);

  if (channel && channel.isTextBased()) {
    try {
      let messages;
      do {
        messages = await channel.messages.fetch({ limit: nMessages });

        if (messages.size > 0) {
          await channel.bulkDelete(messages);
        }
      } while (messages.size >= 2); // loop until clear
    } catch (error) {
      console.error(`Error deleting messages in ${channel.name}:`, error);
    }
  } else {
    console.log(
      `Channel with ID ${channelId} not found or is not a text channel.`
    );
  }
};

module.exports = bulkDeleteMessages;
