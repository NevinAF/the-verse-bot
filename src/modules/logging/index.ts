import { BotModule } from "@/types";

import LoggerListeners from "./LoggerListeners";
import PrintLogChatCommand from "./PrintLogChatCommand";

export default [
	LoggerListeners,
	PrintLogChatCommand
] as BotModule[];