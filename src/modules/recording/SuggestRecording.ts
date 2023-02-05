import { Authors, Buttons } from "@/messaging";
import { BigVoiceChannels, EventChecker } from "@/stats";
import { BotModule } from "@/types";
import { ButtonStyle, ChannelType, ComponentType } from "discord.js";
import RecordingSession from "./RecordingSession";

/**
 * When a VC gets over 4 members, the bot will suggest that the members record the VC.
 */
export default {

	registerVoiceStateUpdate: [async (oldState, newState) =>
	{
		if (newState.channelId)
		{
			const channel = await newState.guild.channels.fetch(newState.channelId);
			if (channel && (channel.type == ChannelType.GuildVoice))
			{
				if (channel.members.size >= 4)
				{
					if (!BigVoiceChannels.IsBig(channel.id))
					{
						BigVoiceChannels.Add(channel.id);

						if (!RecordingSession.GuildHasSession(newState.guild.id))
						{
							await channel.send({
								embeds: [{
									author: Authors.Core,
									description: "@here: Looks like you have a lot of people in this VC. Hit the button below to start recording to save the meeting for anyone missing!"
								}],
								components: Buttons.toNiceActionRows([{
									type: ComponentType.Button,
									label: "Start Recording",
									style: ButtonStyle.Primary,
									custom_id: "startRecording",
									emoji: { name: "🎥" }
								}])
							});
						}
					}
				}
			}
		}

		if (oldState && oldState.channelId)
		{
			const channel = await oldState.guild.channels.fetch(oldState.channelId);
			if (channel && (channel.type == ChannelType.GuildVoice))
			{
				if (channel.members.size < 2)
				{
					BigVoiceChannels.Remove(channel.id);
				}
			}
		}
	}]

} as BotModule;