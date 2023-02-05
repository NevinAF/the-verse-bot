import { BotModule, StateUpdateData } from "@/types";
import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";
import { VoiceState } from "discord.js";

export function VCTime(oldState: VoiceState, newState: VoiceState, data: StateUpdateData)
{
	if (oldState.channelId === null || !oldState.member)
		return;
	
	const duration = data.newTimestamp - data.oldTimestamp;

	UserData.incrementCell(oldState.guild.id, {
		column: UserEntryData.UserID,
		compareValue: oldState.member.id
	}, UserEntryData.VCTime, duration);
}



/**
 * 
 */
export default {

	registerVoiceStateUpdate: [VCTime]

} as BotModule;