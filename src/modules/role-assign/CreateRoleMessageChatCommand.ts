import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { createRoleMessageEmbed } from "./Common";

/**
 * Create a message used for role assignment.
 */
export default {

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("create-role-message")
			.setDescription("Create a message used for role assignment in this channel.")
			.addStringOption(option =>
				option
					.setName("title")
					.setDescription("The title of the role message.")
					.setRequired(true))
			.addStringOption(option =>
				option
					.setName("description")
					.setDescription("The description of the role message.")
					.setRequired(true))
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
		(interaction: ChatInputCommandInteraction) => !interaction.guild ?
			interaction.reply(QuickReplies.interactionNeedsGuild) :
			interaction.deferReply({ ephemeral: true })
				// @ts-ignore - The guild as already been checked for null
				.then(() => createRoleMessageEmbed(interaction.guild, interaction.options.getString("title"), interaction.options.getString("description"), []))
				// @ts-ignore - The interaction must have a channel
				.then(message => interaction.channel.send(message))
				.then(() => interaction.editReply({ content: "Role message created." }))
				.catch(error => interaction.editReply({ content: `An error occurred while creating the role message: ${error}` }))
	]

} as BotModule;