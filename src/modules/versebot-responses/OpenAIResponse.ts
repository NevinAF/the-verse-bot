import {OpenAI} from "@/apis";
import ClientWrapper from "@/ClientWrapper";
import QuickReplies from "@/messaging/QuickReplies";
import { BotModule } from "@/types";
import { SlashCommandBuilder } from "discord.js";


/**
 * Module wrapper for the OpenAI response module
 */
export default {

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName("generate-image")
			.setDescription("Generate an image using OpenAI")
			.addStringOption(option =>
				option.setName("prompt")
					.setDescription("The prompt to use")
					.setRequired(true)),
		async interaction =>
		{
			const prompt = interaction.options.getString("prompt", true);

			if (prompt.length > 1024)
			{
				interaction.reply(QuickReplies.interactionError("Prompt must be less than 1024 characters"));
				return;
			}

			const [_, result_b64_json] = await Promise.all([
				interaction.reply("Generating image for `" + prompt + "`..."),
				OpenAI.getImage(prompt, interaction.user.id)
			]);

			if (!result_b64_json)
			{
				interaction.editReply(QuickReplies.interactionError("Failed to generate image"));
				return;
			}

			const name = prompt.trim().replace(/[^a-zA-Z0-9]/g, "_").substring(0, 61);

			interaction.editReply({
				content: "Prompt: `" + prompt + "`",
				files: [{
					attachment: Buffer.from(result_b64_json, "base64"),
					name: name + ".png"
				}]
			});
		}
	],

	onMessageCreate: [message =>
	{
		if (message.author.bot || !message.mentions.users.some(user => user === ClientWrapper.Client.user))
			return;
		
		const prompt = message.content.replace(/<@!?\d+>/g, "");

		if (prompt.length > 1024)
		{
			return message.reply("Your message is a bit too long for me to respond to (max 1024 characters).");
		}

		return OpenAI.getCompletion(prompt, message.author.id).then(result =>
		{
			return message.reply(result ?? "I seem to have run into an error creating a response for you.");
		});
	}]

} as BotModule;