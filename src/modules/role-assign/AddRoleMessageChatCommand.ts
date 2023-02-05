import { BotModule } from "@/types";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { editRoleMessage } from "./Common";

/**
 * Adds a role to a role message.
 */
export default {

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("add-role-message")
			.setDescription("Removes a role from a role message.")
			.addStringOption(option => option
				.setName("message")
				.setDescription("The ID of the message that you want to remove a role from.")
				.setRequired(true))
			.addRoleOption(option => option
				.setName("role")
				.setDescription("The role that you want to remove from the message.")
				.setRequired(true))
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
		(i) => editRoleMessage(i, true),
	]

} as BotModule;