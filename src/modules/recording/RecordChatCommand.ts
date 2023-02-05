import { Authors } from "@/messaging";
import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import RecordingSession from "./RecordingSession";

function recordCommand(interaction: ChatInputCommandInteraction)
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

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("record")
			.setDescription("Record audio your current voice channel (2hr max).")
			.addBooleanOption(option =>
				option.setName("record-pauses")
					.setDescription("If false, the recording will pause when nobody is speaking. Default is false.")
					.setRequired(false)
		),
		recordCommand
	]

} as BotModule;