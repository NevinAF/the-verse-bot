import Debug from "@/debug";
import { Buttons } from "@/messaging";
import { ButtonInteraction, CacheType } from "discord.js";
import { BotModule } from "@/types";

/**
 * Null call button. Should never be called and well result in a interaction error.
 */
export default {

	registerButton: [Buttons.staticIds.NullCall, (i: ButtonInteraction<CacheType>) =>
		Debug.error(new Error("Interaction is a Null interaction. This should never be called!"))],

} as BotModule;