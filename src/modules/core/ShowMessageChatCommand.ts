import { Authors, Fetching, Previewing } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CacheType, PermissionsBitField, ChatInputCommandInteraction } from "discord.js";

async function showMessage(interaction: ChatInputCommandInteraction<CacheType>)
{
	const msg_link = interaction.options.getString("message-link");

	try {
		var msg = await Fetching.MessageFromURL(msg_link);
		if (!msg) throw new Error();

		interaction.reply({ content: "Here is that message: ", embeds: Previewing.EmbeddedPreviewMessage(msg), ephemeral: true });
	}
	catch (e) { interaction.reply({ content: "Message link was not found.", ephemeral: true }); }
}

/**
 * Show Message command. Shows a message from a message link.
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName('show-message')
			.setDescription('Shows a preview of a message link on discord')
			.addStringOption(option =>
				option.setName('message-link')
					.setDescription('The message link/URL to the target message.')
					.setRequired(true))
			.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
		showMessage
	]
} as BotModule;