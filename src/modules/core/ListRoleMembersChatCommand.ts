import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CommandInteraction, CacheType, ChatInputCommandInteraction } from "discord.js";

async function ListRoleMembers(interaction: ChatInputCommandInteraction<CacheType>)
{
	let content = "";

	const role = interaction.options.getRole('role');

	if (!role)
	{
		await interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "Invalid parameters"
			}], ephemeral: true
		});
		return;
	}

	if (!interaction.guild)
	{
		await interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "Guild not found with this interaction"
			}], ephemeral: true
		});
		return;
	}

	// Only used to update list of users.
	await interaction.guild.members.fetch();

	const members = interaction.guild.members.cache.filter(m => m.roles.cache.has(role.id));
	members.forEach(u => content += `<@${u}>, `);

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