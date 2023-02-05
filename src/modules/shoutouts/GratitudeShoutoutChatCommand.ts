import { GoogleSheets } from "@/apis";
import Debug from "@/debug";
import { Authors, Icons } from "@/messaging";
import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import { APIEmbed, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

namespace GratitudeShoutoutChatCommand
{
	let cached_shoutouts: string[] = [];

	export async function GratitudeShoutout(interaction: ChatInputCommandInteraction)
	{
		if (!interaction.guild)
		{
			return await interaction.reply(QuickReplies.interactionNeedsGuild);
		}

		const who = interaction.options.getUser("who");
		const message = interaction.options.getString("message");

		// Validate inputs
		if (!who)
			return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Who is being thanked must be specified." }], ephemeral: true });
		if (!message)
			return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Message must be specified." }], ephemeral: true });
		if (message.length >= 250)
			return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Message must be less than 250 characters. Keep it short and sweet. If you still need more words, consider also giving a verbal shoutout in a team meeting!" }], ephemeral: true });

		const [author_member, user_member] = await Promise.all([
			interaction.guild.members.fetch(interaction.user.id),
			interaction.guild.members.fetch(who.id),
		]);

		// const gratitudeEmbed: APIEmbed = {
		// 	author: {
		// 		name: author_member.displayName,
		// 		icon_url: author_member.user.displayAvatarURL(),
		// 	},
		// 	description: `<@${who.id}> ${message}`,
		// 	color: 0x00ff00,
		// 	footer: {
		// 		text: "Gratitude Shout-out",
		// 		icon_url: Icons.Gratitude,
		// 	}
		// }

		const gratitudeEmbed: APIEmbed = {
			author: {
				name: user_member.displayName,
				icon_url: user_member.user.displayAvatarURL(),
			},
			description: `${message}`,
			color: 0x00ff00,
			footer: {
				text: "Gratitude Shout-out",
				icon_url: Icons.Gratitude,
			}
		}

		// Send confirmation message
		const reply_msg = await interaction.reply({ embeds: [gratitudeEmbed], fetchReply: true });

		cached_shoutouts.push(reply_msg.url);

		// return await who.send({ content: `${author_member.displayName} has [shown you some gratitude](${reply_msg.url})!` });
	}

	export async function BackupShoutouts()
	{
		Debug.log("Backing up grat shoutouts: " + cached_shoutouts.length);

		if (cached_shoutouts.length === 0) return;

		await GoogleSheets.Append({
			requestBody: {
				values: cached_shoutouts.map(v => [v]),
			},
			range: "Gratitudes",
		}).then(() =>
		{
			cached_shoutouts = [];
		}).catch(err =>
		{
			Debug.log("Failed to backup the gratitude shoutouts!", err);
		});
	}
}

/**
 * Command for creating a gratitude shout out
 */
export default {

	registerBackup: [GratitudeShoutoutChatCommand.BackupShoutouts],

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("gratitude-shoutout")
			.setDescription("Post a shout out to the gratitude boards.")
			.addUserOption(opt => opt
				.setName("who")
				.setDescription("The person who is being thanked.")
				.setRequired(true))
			.addStringOption(opt => opt
				.setName("message")
				.setDescription("The message to be posted. Must be less than 250 characters.")),
		GratitudeShoutoutChatCommand.GratitudeShoutout
	]

} as BotModule;