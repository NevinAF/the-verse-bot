import Debug from "@/debug";
import { Buttons } from "@/messaging";
import { ButtonInteraction, CacheType } from "discord.js";
import { BotModule } from "@/types";

/**
 * Not implemented button. Replies with "Not implemented yet!".
 */
export default {

	registerButton: [Buttons.staticIds.NotImplemented, (i: ButtonInteraction<CacheType>) =>
		i.reply("This button has not been implemented yet! If you think this is a problem, please reach out the admin at The Verse.")
			.catch(Debug.error)]

} as BotModule;

