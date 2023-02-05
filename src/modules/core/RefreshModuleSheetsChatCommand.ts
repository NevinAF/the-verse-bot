import ClientWrapper from "@/ClientWrapper";
import { BotModule } from "@/types";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

/**
 * Refreshes the module sheets.
 */
export default {

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("refresh-module-sheets")
			.setDescription("Refreshes the module sheets.")
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
		async (i) =>
		{
			await i.deferReply({ ephemeral: true });
			await ClientWrapper.Instance.updateModuleSheets(i.guildId);
			await i.editReply("Module sheets refreshed.");
		}
	]

} as BotModule;