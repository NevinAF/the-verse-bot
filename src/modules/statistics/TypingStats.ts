import { BotModule } from "@/types";
import { Typing } from "discord.js";

function typingStarted(typing: Typing)
{
}

/**
 * Module for update user stats when they type
 */
export default {

	registerTypingStart: [typingStarted]

} as BotModule;


