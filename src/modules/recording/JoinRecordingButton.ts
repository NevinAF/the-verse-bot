import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import { ButtonInteraction } from "discord.js";
import RecordingSession from "./RecordingSession";

function joinRecording(interaction: ButtonInteraction)
{
	if (!interaction.guild)
	{
		return interaction.reply(QuickReplies.interactionNeedsGuild);
	}

	const member = interaction.guild.members.cache.get(interaction.user.id);
	const channel = member?.voice?.channel;

	if (!channel)
	{
		return interaction.reply(QuickReplies.interactionError("You must be in a voice channel in order to join a recording session."));
	}

	if (interaction.message.embeds.length < 0 || !interaction.message.embeds[0].description)
	{
		return interaction.reply(QuickReplies.interactionError("The button that you have clicked is not on a message with the correct recording session information. This is likely an internal error, please report it to admins."));
	}

	const message_channel = interaction.message.embeds[0].description.match(/<#(\d+)>/);
	if (!message_channel)
	{
		return interaction.reply(QuickReplies.interactionError("The button that you have clicked does not have a channel number attached. This is likely an internal error, please report it to admins."));
	}

	const session = RecordingSession.Sessions.get(message_channel[1]);

	if (!session)
	{
		return interaction.reply(QuickReplies.interactionError("There is no recording session in this channel. This is likely an internal error, please report it to admins."));
	}

	if (channel.id !== message_channel[1])
	{
		return interaction.reply(QuickReplies.interactionError("You must be in the same voice channel as the recording session in order to join it."));
	}

	return session.joinUser(interaction.user.id).then(joined => joined ?
		interaction.deferUpdate() :
		interaction.reply(QuickReplies.interactionError("You are already in this recording session."))
	);
}

/**
 * Record Command, used for recording audio and video from a voice channel.
 */
export default {

	registerButton: [
		"joinRecording",
		joinRecording
	]

} as BotModule;