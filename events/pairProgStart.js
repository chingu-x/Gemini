const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, PermissionsBitField, ChannelType } = require('discord.js');
const TARGET_VOICE_CHANNEL_ID = '1271183535264501782';
const TARGET_TEXT_CHANNEL_ID = '1271183474170269799';

const readyEvent = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Initialize voiceChannels property
        client.voiceChannels = {};

        const textChannel = client.channels.cache.get(TARGET_TEXT_CHANNEL_ID);

        if (textChannel) {
            // Initial embed
            const initialEmbed = new EmbedBuilder()
                .setColor('#6DE194')
                .setTitle('Chingu Pair Programming')
                .setDescription('Pending\n\nIn progress\n');

            await textChannel.send({ embeds: [initialEmbed] });

            // Signup embed
            const signupEmbed = new EmbedBuilder()
                .setColor('#6DE194')
                .setTitle('Signup')
                .setDescription('Click the button below to signup.');

            const signupButton = new ButtonBuilder()
                .setCustomId('signupButton')
                .setLabel('Signup')
                .setStyle(ButtonStyle.Primary);

            const joinButton = new ButtonBuilder()
                .setCustomId('joinButton')
                .setLabel('Join')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true);

            const actionRow = new ActionRowBuilder().addComponents(signupButton, joinButton);

            await textChannel.send({ embeds: [signupEmbed], components: [actionRow] });
        }
    },
};

const interactionCreateEvent = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const client = interaction.client;

        if (!interaction.isButton()) return;

        const member = interaction.member;
        const guild = interaction.guild;

        // Ensure voiceChannels is initialized
        if (!client.voiceChannels) {
            client.voiceChannels = {};
        }

        const textChannel = guild.channels.cache.get(TARGET_TEXT_CHANNEL_ID);
        const messages = await textChannel.messages.fetch({ limit: 10 });
        const signupMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title === 'Signup');

        if (interaction.customId === 'signupButton') {
            // Check if the user is in the target voice channel
            if (!member.voice.channel || member.voice.channel.id !== TARGET_VOICE_CHANNEL_ID) {
                await interaction.reply({ content: `You need to be in <#${TARGET_VOICE_CHANNEL_ID}> to sign up, please join and try again.`, ephemeral: true });
                return;
            }

            // Get the category of the target voice channel
            const targetVoiceChannel = guild.channels.cache.get(TARGET_VOICE_CHANNEL_ID);
            const category = targetVoiceChannel.parent;

            // Create a new voice channel in the same category
            const voiceChannel = await guild.channels.create({
                name: `${member.displayName}'s Pair Programming`,
                type: ChannelType.GuildVoice,
                parent: category,
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
            });

            // Move the user to the new voice channel
            await member.voice.setChannel(voiceChannel);

            // Create a new private thread in the text channel
            const thread = await textChannel.threads.create({
                name: `${member.displayName}'s Pair Programming`,
                autoArchiveDuration: 60,
                type: ChannelType.PrivateThread,
                reason: 'Private thread for pair programming',
            });

            // Send a message to the thread, mentioning the user and providing a link to the voice channel
            await thread.send({ content: `Hello <@${member.id}>, this is your private thread for pair programming. You can join the voice channel here: <#${voiceChannel.id}>.` });

            // Update the initial embed
            const initialMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title === 'Chingu Pair Programming');

            if (initialMessage) {
                const updatedEmbed = EmbedBuilder.from(initialMessage.embeds[0])
                    .setDescription(`Pending\n${member.displayName}\n\nIn progress\n`);

                await initialMessage.edit({ embeds: [updatedEmbed] });
            }

            // Update the buttons
            const updatedActionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('signupButton')
                        .setLabel('Signup')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true), // Disable signup button
                    new ButtonBuilder()
                        .setCustomId('joinButton')
                        .setLabel('Join')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(false) // Enable join button
                );

            await signupMessage.edit({ components: [updatedActionRow] });

            await interaction.reply({ content: `Your private voice channel has been created and you have been moved to it. You can also access your private thread here: <#${thread.id}>.`, ephemeral: true });

            // Store the voice channel ID and member ID for later use
            client.voiceChannels[member.id] = { voiceChannelId: voiceChannel.id, threadId: thread.id };
        } else if (interaction.customId === 'joinButton') {
            // Check if the user is in the target voice channel
            if (!member.voice.channel || member.voice.channel.id !== TARGET_VOICE_CHANNEL_ID) {
                await interaction.reply({ content: `You need to be in <#${TARGET_VOICE_CHANNEL_ID}> to join, please join and try again.`, ephemeral: true });
                return;
            }

            // Move the user to the existing voice channel
            const voiceChannelId = Object.values(client.voiceChannels)[0].voiceChannelId;
            const threadId = Object.values(client.voiceChannels)[0].threadId;
            const voiceChannel = guild.channels.cache.get(voiceChannelId);
            const thread = guild.channels.cache.get(threadId);

            if (voiceChannel) {
                await member.voice.setChannel(voiceChannel);
                await interaction.reply({ content: `You have been moved to the pair programming voice channel. You can also access the private thread here: <#${thread.id}>.`, ephemeral: true });

                // Ping the user in the thread
                await thread.send({ content: `Hello <@${member.id}>, you have joined the pair programming session.` });
            }
        }
    },
};

const voiceStateUpdateEvent = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const client = oldState.client;
        const member = oldState.member;

        // Ensure voiceChannels is initialized
        if (!client.voiceChannels) {
            client.voiceChannels = {};
        }

        // Check if the user left their private voice channel
        if (client.voiceChannels[member.id] && oldState.channelId === client.voiceChannels[member.id].voiceChannelId && newState.channelId !== client.voiceChannels[member.id].voiceChannelId) {
            const voiceChannel = oldState.guild.channels.cache.get(client.voiceChannels[member.id].voiceChannelId);

            if (voiceChannel) {
                await voiceChannel.delete();

                // Update the initial embed by removing the user's name from Pending
                const textChannel = oldState.guild.channels.cache.get(TARGET_TEXT_CHANNEL_ID);
                const messages = await textChannel.messages.fetch({ limit: 10 });
                const initialMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title === 'Chingu Pair Programming');

                if (initialMessage) {
                    const updatedEmbed = EmbedBuilder.from(initialMessage.embeds[0])
                        .setDescription(initialMessage.embeds[0].description.replace(`${member.displayName}\n`, ''));

                    await initialMessage.edit({ embeds: [updatedEmbed] });
                }

                // Update the buttons
                const signupMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title === 'Signup');
                const updatedActionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('signupButton')
                            .setLabel('Signup')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(false), // Enable signup button
                        new ButtonBuilder()
                            .setCustomId('joinButton')
                            .setLabel('Join')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true) // Disable join button
                    );

                await signupMessage.edit({ components: [updatedActionRow] });

                // Remove the stored voice channel ID
                delete client.voiceChannels[member.id];
            }
        }
    },
};

module.exports = [readyEvent, interactionCreateEvent, voiceStateUpdateEvent];