import { BotModule, StateUpdateData } from "@/types";
import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";
import { VoiceState } from "discord.js";
import { EventChecker } from "@/stats";

export function VCTime(oldState: VoiceState, newState: VoiceState, data: StateUpdateData)
{
	if (oldState.channelId === null || !oldState.member)
		return;
	
	const duration = data.newTimestamp - data.oldTimestamp;

	const promises: Promise<any>[] = [];

	promises.push(
		UserData.incrementCell(oldState.guild.id, {
			column: UserEntryData.UserID,
			compareValue: oldState.member.id
		}, UserEntryData.VCTime, duration)
	);
	
	if (EventChecker.channelIsEvent(oldState.guild, oldState.channelId))
	{
		promises.push(
			UserData.incrementCell(oldState.guild.id, {
				column: UserEntryData.UserID,
				compareValue: oldState.member.id
			}, UserEntryData.VCEventsTime, duration)
		);
	}

	return Promise.all(promises);
}



/**
 * 
 */
export default {

	registerVoiceStateUpdate: [VCTime]

} as BotModule;