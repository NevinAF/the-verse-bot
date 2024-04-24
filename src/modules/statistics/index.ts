import { BotModule } from "@/types";

import ChatListeners from "./ChatListeners";
import VCTime from "./VCTime";
import UserPresence from "./UserPresence";
import MessageReactionStats from "./MessageReactionStats";
import TypingStats from "./TypingStats";

export default [

	ChatListeners,
	VCTime,
	UserPresence,
	MessageReactionStats,
	TypingStats,

] as BotModule[];