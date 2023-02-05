import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";

async function ListRoleMembers(interaction: CommandInteraction<CacheType>)
{
	let content = "";

	const role = interaction.options.get('role').role;

	// Only used to update list of users.
	await interaction.guild.members.fetch();

	const users = interaction.guild.roles.cache.get(role.id).members.map(m => m.user.id);
	users.forEach(u => content += `<@${u}>, `);

	if (content == "") content = "No members were found.";
	else content = content.substring(0, content.length - 2);
	await interaction.reply({ embeds: [{ description: `<@&${role.id}>-> ${content}`, author: Authors.Core }], ephemeral: true });
}

/**
 * List Role Members command. Replies with a list of members in the role.
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName('list-role-members')
			.setDescription('Lists all members of a given role.')
			.addRoleOption(option =>
				option.setName('role')
					.setDescription('The input to be parsed for times')
					.setRequired(true)),
		ListRoleMembers
	]
} as BotModule;