import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CommandInteraction, CacheType, PermissionsBitField } from "discord.js";

async function AddButton(interaction: CommandInteraction<CacheType>)
{
	// const channel = interaction.options.getChannel("channel");
	// const msgid = interaction.options.getString("msg-id");
	// const customId = interaction.options.getString("custom-id");
	// const Emoji = interaction.options.getString("emoji");
	// const Label = interaction.options.getString("label");
	// const Style = interaction.options.getString("style");
	// const URL = interaction.options.getString("url");

	await interaction.reply({ content: "Not implemented yet", ephemeral: true });
}

/**
 * Add button command. Adds a button to a message embed.
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName('add-button')
			.setDescription('Edits an embedded message!')
			.addChannelOption(option =>
				option.setName('channel')
					.setDescription('Channel with target message.')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('msg-id')
					.setDescription('The message that should be edited.')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('custom-id')
					.setDescription('ID of the button.')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('label')
					.setDescription('Text that shows on the button.')
					.setRequired(false))
			.addStringOption(option =>
				option.setName('emoji')
					.setDescription('Emoji that is shown to the left of the button.')
					.setRequired(false))
			.addStringOption(option =>
				option.setName('style')
					.setDescription('The look of the button')
					.addChoices(
						{ value: "PRIMARY", name: "PRIMARY" })
					.setRequired(false))
			.addStringOption(option =>
				option.setName('url')
					.setDescription('URL that can be click on the right side of the button')
					.setRequired(false))
			.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
		AddButton
	]
} as BotModule;