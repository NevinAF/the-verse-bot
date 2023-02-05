import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { ButtonInteraction } from "discord.js";
import RecordingSession from "./RecordingSession";

function joinRecording(interaction: ButtonInteraction)
{
	const member = interaction.guild.members.cache.get(interaction.user.id);
	const channel = member?.voice?.channel;
	if (!channel)
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "You must be in a voice channel in order to join a recording session."
			}], ephemeral: true
		});
	}

	const message_channel = interaction.message.embeds[0].description.match(/<#(\d+)>/);
	if (!message_channel)
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "The button that you have clicked does not have a channel number attached. This is likely an internal error, please report it to admins."
			}], ephemeral: true
		});
	}

	const session = RecordingSession.Sessions.get(message_channel[1]);

	if (!session)
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "There is no recording session in this channel. This is likely an internal error, please report it to admins."
			}], ephemeral: true
		});
	}

	if (channel.id !== message_channel[1])
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "You must be in the same voice channel as the recording session in order to join it."
			}], ephemeral: true
		});
	}

	return session.joinUser(interaction.user.id).then(joined => joined ?
		interaction.deferUpdate() :
		interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "You are already in this recording session."
			}], ephemeral: true
		})
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