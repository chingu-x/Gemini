const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Events,
  PermissionsBitField,
  ChannelType,
  time,
} = require("discord.js");
const bulkDeleteMessages = require("../helpers/bulkDeleteMessages");
const TARGET_VOICE_CHANNEL_ID = "1274480315171344496";
const TARGET_TEXT_CHANNEL_ID = "1274471101191290992";

const readyEvent = {
  name: "ready",
  once: true,
  async execute(client) {
    // Initialize voiceChannels property
    client.voiceChannels = {};

    const textChannel = client.channels.cache.get(TARGET_TEXT_CHANNEL_ID);

    // Deletes all messages from channel before putting startup message.
    await bulkDeleteMessages(TARGET_TEXT_CHANNEL_ID, client);

    if (textChannel) {
      // Signup embed
      const signupEmbed = new EmbedBuilder()
        .setColor("#6DE194")
        .setTitle("Pair Programming")
        .setDescription(
          `Looking to level up your coding skills? Click the "signup" button to get instantly paired with a fellow programmer.
           Collaborate, code, and conquer projects together—your next great partnership starts here!
           
           Users in queue: 0
           `
        );

      const button = new ButtonBuilder()
        .setCustomId("signupButton")
        .setLabel("Signup")
        .setStyle(ButtonStyle.Success);

      const actionRow = new ActionRowBuilder().addComponents(button);

      await textChannel.send(`
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
         
        Line1:
        Line2:
        Line3:
         
        Testing`);

      await textChannel.send({
        embeds: [signupEmbed],
        components: [actionRow],
      });
    }
  },
};

const interactionCreateEvent = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

    if (!interaction.isButton()) return;
    if (interaction.customId !== "signupButton") return;

    const member = interaction.member;
    const guild = interaction.guild;

    const textChannel = guild.channels.cache.get(TARGET_TEXT_CHANNEL_ID);

    // Create a new private thread in the text channel
    const thread = await textChannel.threads.create({
      name: `${member.user.username}'s Pair Programming`,
      autoArchiveDuration: 60,
      type: ChannelType.PrivateThread,
      reason: "Private thread for pair programming",
    });

    // Initial thread information, possibly list commands for ideas to do, what the VC button does etc
    await thread.send({
      content: `
      Description of what the thread is for
      //Wait for other person, they'll join when found

      List of commands (if applicable):
        /ping       <desc>
        /pong <desc>
        /serverinfo <desc>
      `,
    });

    const VCEmbed = new EmbedBuilder()
      .setColor("#6DE194")
      .setTitle("This is a embed to describe your thread/voice channel.")
      .setDescription(`Click below to create a new VC.`);

    const createVCButton = new ButtonBuilder()
      .setCustomId("newVCButton")
      .setLabel("Join VC")
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(createVCButton);

    thread.send({
      embeds: [VCEmbed],
      components: [actionRow],
    });

    // Send a message to the thread, mentioning the user
    await thread.send({
      content: `Hello <@${member.id}>, this is your private thread for pair programming.`,
    });

    // Update the initial embed
    const messages = await textChannel.messages.fetch({ limit: 10 });
    const initialMessage = messages.find(
      (msg) =>
        msg.embeds.length > 0 &&
        msg.embeds[0].title === "Chingu Pair Programming"
    );

    if (initialMessage) {
      const updatedEmbed = EmbedBuilder.from(
        initialMessage.embeds[0]
      ).setDescription(`Pending\n${member.user.username}\n\nIn progress\n`);

      await initialMessage.edit({ embeds: [updatedEmbed] });
    }
  },
};

const createPPVoiceEvent = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

    if (!interaction.isButton()) return;
    if (interaction.customId !== "newVCButton") return;

    // Ensure voiceChannels is initialized
    if (!client.voiceChannels) {
      client.voiceChannels = {};
    }

    const guild = interaction.guild;
    const member = interaction.member;

    const voiceChannel = await guild.channels
      .create({
        name: `${member.user.username}'s Pair Programming`,
        type: ChannelType.GuildVoice,
        parent: TARGET_VOICE_CHANNEL_ID,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: member.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      })
      .catch(console.error);

    // Move the user to the new voice channel
    try {
      await member.voice.setChannel(voiceChannel);

      await interaction.reply({
        content:
          "Your private voice channel has been created and you have been moved to it.",
        ephemeral: true,
      });
    } catch (err) {
      interaction.reply({
        content: "You must be in a voice channel to be moved automatically.",
        ephemeral: true,
      });
    }

    // Store the voice channel ID and member ID for later use
    client.voiceChannels[member.id] = voiceChannel.id;

    // deletes channel after n seconds
    const timeToDelete = 20;
    checkEmptyChannel(voiceChannel, timeToDelete);
  },
};

module.exports = [
  readyEvent,
  interactionCreateEvent,
  createPPVoiceEvent,
  // voiceStateUpdateEvent
];
