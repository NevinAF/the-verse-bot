import Debug from "@/debug";
import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CommandInteraction, CacheType, APIEmbed, Message, TextChannel, PermissionsBitField, ChatInputCommandInteraction } from "discord.js";

async function EditEmbed(interaction: ChatInputCommandInteraction<CacheType>)
{
	const channel = interaction.options.getChannel("channel");
	const msgid = interaction.options.getString("msg-id");
	const embed = interaction.options.getString("embed");

	if (!channel || !msgid || !embed)
	{
		await interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "Invalid parameters"
			}], ephemeral: true
		});
		return;
	}

	var embedObj: APIEmbed[] = [];
	if (embed) try { embedObj.push(JSON.parse(embed) as APIEmbed); }
	catch (error)
	{
		Debug.error(error);
		interaction.reply({ content: "Failed to parse the embed. Check the formating!", embeds: [{
			title: "Embed:",
			description: embed
		}], ephemeral: true});
		return;
	}

	var message: Message<boolean>;
	try
	{
		message = await (await interaction.guild?.channels.fetch(channel.id) as TextChannel).messages.fetch(msgid);

		if (!message)
			throw new Error("Message not found");
	}
	catch {
		await interaction.reply({
			content: "Failed to find message!", 
			ephemeral: true
		});
		return;
	}

	if (message.author.id != interaction.client.user.id)
	{
		await interaction.reply({ content: "Cannot edit message that is not from this bot! (author of message is <@" + message.author.id + ">", ephemeral: true});
		return;
	}

	try
	{
		await message.edit({ embeds: embedObj });
		interaction.reply({ content: "Message has been editted!", ephemeral: true});
	}
	catch (error)
	{
		Debug.log("Failed to edit message!", error);
		interaction.reply({ content: "Could not edit message due to Discord API error!", ephemeral: true});
	}
}

/**
 * Edit embed command. Edits an embedded message!
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName('edit-embed')
			.setDescription('Edits an embedded message!')
			.addChannelOption(option =>
				option.setName('channel')
					.setDescription('Channel with target message.')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('msg-id')
					.setDescription('The message that should be editted.')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('embed')
					.setDescription('Embed to add to message.')
					.setRequired(true))
			.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
		EditEmbed
	]
} as BotModule;