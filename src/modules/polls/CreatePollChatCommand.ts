import { SlashCommandBuilder } from "@discordjs/builders";
import { APIButtonComponent, APIEmbed, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, ComponentType, EmbedData, GuildMember } from "discord.js";
import * as crypto from "crypto";
import ClientWrapper from "@/ClientWrapper";
import { Authors, Buttons, Emojis, Fetching } from "@/messaging";
import { MessageOptions } from "child_process";
import common from "./common";
import Debug from "@/debug";
import { BotModule } from "@/types";


async function CreatePoll(cmd: CommandInteraction)
{
	const title = cmd.options.get("title")?.value as string;
	const desc = cmd.options.get("description")?.value as string;
	const anon = cmd.options.get("anonymous")?.value as boolean ?? false;
	var options: string[] = [];

	if (!title) return await cmd.reply({ content: "You must provide a title for the poll", ephemeral: true });

	for (var i = 1; i < 10; i++)
	{
		const opt = cmd.options.get("option-" + i.toString())?.value as string ?? "";
		if (opt) options.push(opt);
	}

	const max_votes = cmd.options.get("max-votes")?.value as number ?? options.length;

	if (options.length < 2)
		return await cmd.reply({ embeds: [{ author: Authors.Error, description: "You must have at least two options to start a poll!" }], ephemeral: true });
	if (max_votes <= 0)
		return await cmd.reply({ embeds: [{ author: Authors.Error, description: `Max votes (${max_votes}) must be a positive number` }], ephemeral: true });

	if (max_votes > options.length)
		return await cmd.reply({ embeds: [{
			author: Authors.Error,
			description: `Max votes (${max_votes}) must be less than or equal to the number of options (${options.length}).`
		}], ephemeral: true });

	var indices = options.flatMap((opt, index) => (opt.length >= 254 || opt.length < 1) ? [index] : []);

	if (indices.length > 0)
		return await cmd.reply({ embeds: [{
			author: Authors.Error,
			description: "Voting options must be less than 254 characters. Invalid options: [ " + indices.join(", ") + " ]"
		}], ephemeral: true });

	// Fetch the user of the command
	const mem = await Fetching.commandMember(cmd);
	if (!mem) return;

	const pollEmbed: APIEmbed = {
		author: { icon_url: mem.displayAvatarURL(), name: mem.displayName },
		color: 0xffff00,
		title: title,
		description: desc ?? undefined,
		fields: options.map((opt, index) => ({
			name: Emojis.numbers(index) + " " + opt,
			value: "Vote Count: `0`",
			inline: opt.length < 100,
		})),
		footer: { text: "Select a max of " + max_votes + ` (${anon ? "" : "NOT "}anonymous)` },
	};

	const components = Buttons.toNiceActionRows(
		options.map((_, index) => ({
			type: ComponentType.Button,
			custom_id: common.pollButtonName + index,
			label: "Vote/Unvote",
			style: ButtonStyle.Secondary,
			emoji: { name: Emojis.numbers(index) },
		}))
	);

	await cmd.reply({
		embeds: [pollEmbed],
		ephemeral: false,
		components: components
	});
}

export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("create-poll")
			.setDescription("Create a message that lets members vote on options")
			.addStringOption(options => options
				.setName("title")
				.setDescription("The title of the poll")
				.setRequired(true))
			.addStringOption(options => options
				.setName("description")
				.setDescription("Description that will be included with the poll")
				.setRequired(false))
			.addBooleanOption(options => options
				.setName("anonymous")
				.setDescription("If the poll should be anonymous (default false)")
				.setRequired(false))
			.addNumberOption(options => options
				.setName("max-votes")
				.setDescription("Number of options each member can select (defaults to number of options)")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-1")
				.setDescription("A votable option for the message")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-2")
				.setDescription("A votable option for the message")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-3")
				.setDescription("A votable option for the message")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-4")
				.setDescription("A votable option for the message")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-5")
				.setDescription("A votable option for the message")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-6")
				.setDescription("A votable option for the message")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-7")
				.setDescription("A votable option for the message")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-8")
				.setDescription("A votable option for the message")
				.setRequired(false))
			.addStringOption(options => options
				.setName("option-9")
				.setDescription("A votable option for the message")
				.setRequired(false)),
		CreatePoll
	]
} as BotModule