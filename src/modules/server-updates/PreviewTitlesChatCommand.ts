import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import TitlePopulator from "@/user-titles/TitlePopulator";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

/**
 * Module to print the computed titles in order to preview the results.
 */
export default {

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("preview-titles")
			.setDescription("Prints the computed titles in order to preview the results.")
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
		async (interaction) =>
		{
			if (!interaction.guild)
			{
				return await interaction.reply(QuickReplies.interactionNeedsGuild);
			}

			await interaction.deferReply();

			await TitlePopulator.populate(interaction.guild);

			return await interaction.editReply("Done.");
		}
	]

} as BotModule;