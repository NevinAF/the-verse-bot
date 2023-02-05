import { BotModule } from "@/types";

import SchedulerMod from "./SchedulerMod";
import GetTimeChatCommand from "./GetTimeChatCommand";
import EventVoiceChannelCreator from "./EventVoiceChannelCreator";

export default [
	SchedulerMod,
	GetTimeChatCommand,
	EventVoiceChannelCreator,
] as BotModule[];