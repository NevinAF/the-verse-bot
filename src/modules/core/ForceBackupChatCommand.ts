import ClientWrapper from "@/ClientWrapper";
import { BotModule } from "@/types";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

/**
 * Force a backup of all cached data to disk or to the cloud.
 */
export default {

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("forcebackup")
			.setDescription("Force a backup of all cached data to disk or to the cloud.")
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
		
		async (interaction) =>
		{
			await Promise.all([
				interaction.deferReply({ ephemeral: true }),
				ClientWrapper.Instance.backup()
			]);
			await interaction.followUp({ content: "Backup complete!", ephemeral: true });
		}
	]

} as BotModule;