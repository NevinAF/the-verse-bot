import Debug from "@/debug";
import { BotModule } from "@/types";
import { CommandInteraction, InteractionReplyOptions, SlashCommandBuilder } from "discord.js";

async function print_log(i: CommandInteraction)
{
	let first = true;

	let log = Debug.logOutput;
	while (log.length > 0)
	{
		let chunk = log.substring(0, 2000);
		let lastNewline = chunk.lastIndexOf("\n");
		if (lastNewline > 0)
		{
			chunk = chunk.substring(0, lastNewline);
			log = log.substring(lastNewline + 1);
		}

		const reply: InteractionReplyOptions = {
			content: "```json\n" + chunk + "\n```",
			ephemeral: true
		};

		if (first)
		{
			await i.reply(reply);
			first = false;
		}
		else await i.followUp(reply);
	}
}

/**
 * Print log command. Prints the discord js bots log to the user within discord.
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("print-log")
			.setDescription("Prints the tail end of the bot's log."),
		print_log
	]
} as BotModule;