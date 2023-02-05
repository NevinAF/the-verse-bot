import Debug from "@/debug";
import { Authors } from "@/messaging";
import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import { ButtonInteraction } from "discord.js";
import { updateRoleMessageEmbed } from "./Common";

async function changeRole(interaction: ButtonInteraction)
{
	if (!interaction.guild)
	{
		return await interaction.reply(QuickReplies.interactionNeedsGuild);
	}

	await interaction.deferReply({ ephemeral: true });

	const [member, roles] = await Promise.all([
		interaction.guild.members.fetch(interaction.user.id),
		interaction.guild.roles.fetch()
	]);
	const roleName = interaction.component.label;

	let role = roles.find(r => r.name === roleName || r.id === roleName);

	if (!role)
	{
		Debug.warning(`Role ${roleName} does not exist.`);
		return await interaction.editReply({
			embeds: [{
				author: Authors.Error,
				description: "The role that you have clicked does not exist. This is likely an internal error, please report it to admins."
			}]
		}).catch(() => { });
	}

	if (member.roles.cache.has(role.id))
	{
		await member.roles.remove(role);
		Debug.log(`Removed role ${role.name} from ${member.user.tag}`);
	}
	else
	{
		await member.roles.add(role);
		Debug.log(`Added role ${role.name} to ${member.user.tag}`);
	}

	await updateRoleMessageEmbed(interaction.message);

	await interaction.editReply({
		embeds: [{
			author: Authors.RoleAssign,
			description: `You have ${member.roles.cache.has(role.id) ? "added" : "removed"} the role <@&${role.id}>.`
		}]
	}).catch(() => { });
}

/**
 * Button for adding or removing a role from a user.
 */
export default {

	registerButton: [
		/changeRole_[0-9]+/,
		changeRole
	]

} as BotModule;