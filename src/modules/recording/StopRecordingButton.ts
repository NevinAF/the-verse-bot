import Debug from "@/debug";
import { Authors, Fetching } from "@/messaging";
import { BotModule } from "@/types";
import { ButtonInteraction, PermissionsBitField } from "discord.js";
import RecordingSession from "./RecordingSession";

async function stopRecording(interaction: ButtonInteraction)
{
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

	if (session.creatorId !== interaction.user.id && !Fetching.interactionPermissions(interaction, PermissionsBitField.Flags.Administrator))
	{
		return interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "You must be the one who started the recording session or an admin in order to stop it."
			}], ephemeral: true
		});
	}

	await interaction.deferUpdate();

	session.stopRecording(`User ${interaction.id} ended the recording`).catch(Debug.error);
}

/**
 * Record Command, used for recording audio and video from a voice channel.
 */
export default {

	registerButton: [
		"stopRecording",
		stopRecording
	],

	// Automatically stop all recordings if the bot is shut down.
	onExiting: [async () =>
	{
		for await (const session of RecordingSession.Sessions.values())
		{
			await session.stopRecording("Bot is shutting down").catch(Debug.error);
		}
	}]

} as BotModule;