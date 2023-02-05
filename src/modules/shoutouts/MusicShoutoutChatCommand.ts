import { GoogleSheets } from "@/apis";
import Deezer from "@/apis/Dezzer";
import Debug from "@/debug";
import { Authors, Buttons, Emojis } from "@/messaging";
import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import { APIButtonComponent, ButtonStyle, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder } from "discord.js";

namespace MusicShoutoutChatCommand
{
	let cached_shoutouts: string[] = [];

	export async function MusicShoutout(interaction: ChatInputCommandInteraction)
	{
		if (!interaction.guild)
		{
			return await interaction.reply(QuickReplies.interactionNeedsGuild);
		}

		const songSearch = interaction.options.getString("song-search");

		// Validate inputs
		if (!songSearch)
			return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Song search must be specified."}], ephemeral: true });
		if (songSearch.length > 100 || songSearch.length < 3)
			return await interaction.reply({ embeds: [{ author: Authors.Error, description: "Song search must be between 3 and 100 characters."}], ephemeral: true });

		const [member, results, _] = await Promise.all([
			interaction.guild.members.fetch(interaction.user.id),
			Deezer.Search(songSearch),
			interaction.deferReply({ ephemeral: true }),
		]);

		if (!results)
		{
			interaction.followUp
			await interaction.followUp({
				embeds: [{
					author: Authors.Error,
					description: "Spotify API did not respond!"
				}], ephemeral: true
			});
			return;
		}

		Debug.log(results);
		
		if (!results?.data)
		{
			await interaction.followUp({
				embeds: [{
					author: Authors.Error,
					description: "Spotify API did not respond with a valid body!"
				}], ephemeral: true
			});
			return;
		}

		if (results.data.length === 0)
		{
			await interaction.followUp({
				embeds: [{
					author: Authors.Error,
					description: "No results found!"
				}], ephemeral: true
			});
			return;
		}
		
		const displaceCount = Math.min(8, results.data.length);

		const choice_buttons: APIButtonComponent[] = results.data
			.slice(0, displaceCount)
			.map((track, index) => ({
				type: ComponentType.Button,
				emoji: { name: Emojis.numbers(index) },
				custom_id: index.toString(),
				style: ButtonStyle.Secondary,
				label: track.title_short,
			}));
		
		const selectionMessage = await interaction.followUp({
			embeds: [{
				author: Authors.Shoutout,
				description: "Please select the correct song to shoutout. You have 5 minutes to select a song.",
				color: 0x5865F2,
				footer: { text: "Buttons will expire after 5 minutes." },
			},
				...results.data.slice(0, displaceCount).map((track, index) =>
				{
					const embed = Deezer.CreateTrackEmbed(track);
					embed.title = Emojis.numbers(index) + " " + embed.title;
					return embed;
				})
			],
			components: Buttons.toNiceActionRows([
				...choice_buttons,
				{
					type: ComponentType.Button,
					label: "Cancel",
					custom_id: "cancel",
					style: ButtonStyle.Danger,
				}
			])
		});

		const btn_interaction = await interaction.channel?.awaitMessageComponent({ time: 1000 * 60 * 5 });

		if (!btn_interaction)
		{
			return await interaction.editReply({ components: [], embeds: [{ author: Authors.Error, description: "Selection timed out." }] }).catch(() => { });
		}
		
		const deferred_promise = btn_interaction.deferUpdate();


		if (btn_interaction.customId === "cancel")
		{
			return await Promise.all([
				interaction.editReply({ components: [], embeds: [], content: "Selection cancelled." }).catch(() => { }),
				deferred_promise
			]);
		}

		const track = results.data[parseInt(btn_interaction.customId)];

		// Send shoutout message and upload to Google Sheets
		const trackEmbed = Deezer.CreateTrackEmbed(track);
		trackEmbed.footer = { text: "Music Shout-out by " + member.displayName };
		const [music_message, _1, _2] = await Promise.all([
			interaction.channel?.send({ embeds: [trackEmbed] }),
			deferred_promise,
			interaction.editReply({ components: [], embeds: [], content: "Shout-out Sent!" }).catch(() => { }),
		]);

		if (!music_message)
		{
			Debug.error("Failed to send music message!");
			return;
		}

		cached_shoutouts.push(music_message.url);

		return;
	}

	export async function BackupShoutouts()
	{
		Debug.log("Backing up music shoutouts: " + cached_shoutouts.length);
		if (cached_shoutouts.length === 0) return;

		GoogleSheets.Append({
			requestBody: {
				values: cached_shoutouts.map(v => [v]),
			},
			range: "MusicShouts",
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

	registerBackup: [MusicShoutoutChatCommand.BackupShoutouts],

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("music-shoutout")
			.setDescription("Post a shout out to the music board.")
			.addStringOption(opt => opt
				.setName("song-search")
				.setDescription("This will be used to search for the song for the post. Less than 100 characters.")
				.setRequired(true)),
		MusicShoutoutChatCommand.MusicShoutout
	]

} as BotModule;