import ClientWrapper from "@/ClientWrapper";
import { Authors, Previewing } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";

/**
 * Bot Stats command. Replies with bot stats.
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
		.setName('bot-stats')
		.setDescription('Replies with some basic stats!'),
		(cmd: CommandInteraction<CacheType>) =>
			cmd.reply({
				embeds: [{
					author: Authors.Core,
					color: 0x5A5A5A,
					title: "Bot Stats",
					description: [
						["Uptime", ClientWrapper.Client.uptime ? Previewing.msToHuman(ClientWrapper.Client.uptime) : "Unknown"],
						// ["Total Uses", ClientWrapper.Instance.GetUses(null)],
						// ...ClientWrapper.Instance.GetAllUses()
					].map(([key, value]) => `**${key}**: ${value}`).join("\n"),
				}],
				ephemeral: true
			})
	]
} as BotModule;