import Debug from "@/debug";
import { Authors, Fetching } from "@/messaging";
import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import { ButtonInteraction, PermissionsBitField } from "discord.js";
import RecordingSession from "./RecordingSession";

async function startRecording(interaction: ButtonInteraction)
{
	if (!interaction.guild)
	{
		return interaction.reply(QuickReplies.interactionNeedsGuild);
	}

	const member = interaction.guild.members.cache.get(interaction.user.id);
	const channel = member?.voice?.channel;
	if (!channel)
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "You must be in a voice channel in order to begin recording."
			}], ephemeral: true
		});
	}

	if (channel.guildId != interaction.guildId)
	{
		return interaction.reply(QuickReplies.interactionError("You must be in a voice channel in this server."));
	}

	if (channel.id != interaction.message.channelId)
	{
		return interaction.reply(QuickReplies.interactionError("You must be in the same voice channel as this message."));
	}

	if (RecordingSession.Sessions.has(channel.id))
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "There is already a recording session in this channel."
			}], ephemeral: true
		});
	}

	// @ts-ignore - The guild as already been checked for null
	return RecordingSession.CreateSession(interaction, channel);
}

/**
 * Record Command, used for recording audio and video from a voice channel.
 */
export default {

	registerButton: [
		"startRecording",
		startRecording
	],

} as BotModule;