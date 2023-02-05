import { BotModule } from "@/types";

import ChatListeners from "./ChatListeners";
import VCTime from "./VCTime";
import UserPresence from "./UserPresence";

export default [

	ChatListeners,
	VCTime,
	UserPresence,

] as BotModule[];