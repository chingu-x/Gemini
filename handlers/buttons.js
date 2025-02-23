const { ButtonBuilder, ButtonStyle } = require('discord.js');

function createDeveloperButton() {
    return new ButtonBuilder()
        .setCustomId('Developer')
        .setLabel('Developer')
        .setStyle(ButtonStyle.Primary);
}

function createAgileLeaderButton() {
    return new ButtonBuilder()
        .setCustomId('Agile Leader')
        .setLabel('Agile Leader')
        .setStyle(ButtonStyle.Primary);
}

function createBasicButton() {
    return new ButtonBuilder()
        .setCustomId('Basic')
        .setLabel('Basic')
        .setStyle(ButtonStyle.Primary);
}

function createIntermediateButton() {
    return new ButtonBuilder()
        .setCustomId('Intermediate')
        .setLabel('Intermediate')
        .setStyle(ButtonStyle.Primary);
}

function createAdvancedButton() {
    return new ButtonBuilder()
        .setCustomId('Advanced')
        .setLabel('Advanced')
        .setStyle(ButtonStyle.Primary);
}

function createYesButton() {
    return new ButtonBuilder()
        .setCustomId('yes')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Primary);
}

function createNoButton() {
    return new ButtonBuilder()
        .setCustomId('no')
        .setLabel('No')
        .setStyle(ButtonStyle.Danger);
}

module.exports = { 
    createDeveloperButton,
    createAgileLeaderButton,
    createBasicButton,
    createIntermediateButton,
    createAdvancedButton,
    createYesButton,
    createNoButton
};