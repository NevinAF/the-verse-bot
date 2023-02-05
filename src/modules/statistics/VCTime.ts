import { BotModule, VoiceStateStamp } from "@/types";
import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";
import { VoiceState } from "discord.js";

export function VCTime(oldState: VoiceStateStamp, newState: VoiceStateStamp)
{
	if (oldState.state.channelId === null)
		return;
	
	const duration = newState.timestamp - oldState.timestamp;

	UserData.incrementCell(oldState.state.guild.id, {
		column: UserEntryData.UserID,
		compareValue: oldState.state.member.id
	}, UserEntryData.VCTime, duration);
}



/**
 * 
 */
export default {

	registerVoiceStateUpdate: [VCTime]

} as BotModule;