import { BotModule } from "@/types";
import Debug from "@/debug";
import { Fetching, Authors, Emojis } from "@/messaging";
import { ButtonInteraction } from "discord.js";
import common from "./common";
import * as crypto from "crypto";

async function PollButton(btn: ButtonInteraction)
{
	const index = parseInt(btn.customId.substring(common.pollButtonName.length));

	const msg = await Fetching.buttonMessage(btn);
	if (!msg) return;

	if (!msg.embeds || msg.embeds.length != 1 || msg.embeds[0].fields.length < 2 || !msg.components)
	{
		await btn.reply({ embeds: [{
			author: Authors.Error,
			description: "Poll message has a bad format! We could not register a vote." }],
			ephemeral: true
		});
		Debug.error(new Error("Poll message has a bad format! We could not register a vote."));
		return;
	}

	const max = parseInt(msg.embeds[0].footer.text.substring("Select a max of ".length));
	const anon = msg.embeds[0].footer.text.endsWith("(anonymous)");
	const name: (count: number) => string = (anon) ?
		count => "`" + crypto.createHash("SHA256").update(btn.user.id + msg.id + count)
					.digest("base64").substring(0, 12).replace('\n', "$") + "`" :
		_ => `<@${btn.user.id}>`;

	const content = {
		embeds: [msg.embeds[0]],
		components: msg.components
	};


	if (index > msg.embeds[0].fields.length)
		return await btn.reply({ embeds: [{
			author: Authors.Error,
			description: "It seems like your voting option is out of range (option " + index + ")." }],
			ephemeral: true
		});

	var voted: number[] = [];

	msg.embeds[0].fields.forEach((field, field_index) => {
		if (field.value.split("\n")
			.find((n, name_index) =>
				n == name(field_index))
		) {
			voted.push(field_index);
		}
	});

	const voting = !voted.includes(index);
	if (voted.length >= max && voting)
	{
		const votedOptions = voted.map(i => Emojis.numbers(i)).join(", ");

		await btn.reply({ embeds: [{
			author: Authors.Warning,
			description: "You cannot vote more than " + max + " time(s) on this poll. Please un-vote an answer first. Your votes are: " + votedOptions + "."
		}], ephemeral: true
		});
		return;
	}

	const def_promise = btn.deferUpdate();

	const indexof = content.embeds[0].fields[index].value.indexOf("\n");
	const val = indexof != -1 ?
		content.embeds[0].fields[index].value.substring(indexof) :
		"";

	var replace: string;
	if (!voting)
	{
		replace = val.split("\n").filter((n) =>
			n != name((index))
		).join("\n");

		Debug.log(`${btn.user.username} un-voted for '${content.embeds[0].fields[index].name}'`);
	}
	else
	{
		replace = val + "\n" + name(index);
		Debug.log(`${btn.user.username} voted for '${content.embeds[0].fields[index].name}'`);
	}

	replace = "Vote Count: `" + (replace.split("\n").length - 1) + "`" + replace;
	content.embeds[0].fields[index].value = replace;

	await msg.edit(content).catch(Debug.error);
	await def_promise;
}

/**
 * Button for adding or removing self from a poll option
 */
export default {

	registerButton: [
		common.pollButtonName + "[0-9]+",
		PollButton
	]

} as BotModule;