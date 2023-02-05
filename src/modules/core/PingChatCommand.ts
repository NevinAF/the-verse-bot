import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";

/**
 * Ping command. Replies with "Pong!".
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName('ping')
			.setDescription('Replies with Pong!'),
		(interaction: CommandInteraction<CacheType>) => interaction.reply({ embeds: [{ description: 'Pong!', author: Authors.Core }], ephemeral: true })
	]
} as BotModule;