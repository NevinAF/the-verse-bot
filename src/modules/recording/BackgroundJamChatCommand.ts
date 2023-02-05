import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior } from "@discordjs/voice";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import RecordingSession from "./RecordingSession";

const backgroundMusicClips = [
	"public/sound/background/acoustic-vibe-124586.mp3",
	"public/sound/background/cinematic-time-lapse-115672.mp3",
	"public/sound/background/lofi-study-112191.mp3",
	"public/sound/background/relaxed-vlog-131746.mp3",
	"public/sound/background/wake-up-to-the-renaissance-135540.mp3"
];

function backgroundJam(interaction: ChatInputCommandInteraction)
{
	if (!interaction.guild)
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "This command can only be used in a guild!"
			}], ephemeral: true
		});
	}

	const member = interaction.guild.members.cache.get(interaction.user.id);
	const channel = member?.voice?.channel;
	if (!channel)
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "You must be in a voice channel in order to begin some music."
			}], ephemeral: true
		});
	}

	if (RecordingSession.GuildHasSession(interaction.guild.id))
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "Your server is already using the bot to record a meeting. End the meeting before starting a background jam."
			}], ephemeral: true
		});
	}

	interaction.reply({
		embeds: [{
			author: Authors.Success,
			description: "Starting background jam..."
		}]
	});

	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: interaction.guild.id,
		adapterCreator: interaction.guild.voiceAdapterCreator,
		selfDeaf: true,
		selfMute: false,
	});

	const player = createAudioPlayer({
		behaviors: {
			noSubscriber: NoSubscriberBehavior.Pause,
		},
	});

	let audioResource = createAudioResource(backgroundMusicClips[Math.floor(Math.random() * backgroundMusicClips.length)]);
	player.play(audioResource);

	const subscription = connection.subscribe(player);

	player.on("stateChange", (oldState, newState) =>
	{
		if (newState.status === AudioPlayerStatus.Idle)
		{
			audioResource = createAudioResource(backgroundMusicClips[Math.floor(Math.random() * backgroundMusicClips.length)]);
			player.play(audioResource);
		}
	});
}

/**
 * Fun little command to play background music while you jam.
 */
export default {

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("backgroundjam")
			.setDescription("Play background music while you jam."),
		backgroundJam
	]

} as BotModule;