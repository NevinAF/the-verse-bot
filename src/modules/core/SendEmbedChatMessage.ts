import Debug from "@/debug";
import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CommandInteraction, CacheType, APIEmbed, TextChannel, PermissionsBitField, ChatInputCommandInteraction } from "discord.js";

async function sendEmbed(interaction: ChatInputCommandInteraction<CacheType>)
{
	const channel = interaction.options.getChannel("channel");
	const embed = interaction.options.getString("embed");

	if (!channel || !embed)
	{
		await interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "Invalid parameters"
			}], ephemeral: true
		});
		return;
	}

	if (!interaction.guild)
	{
		await interaction.reply({
			embeds: [{
				author: Authors.Error,
				description: "This command can only be used in a guild!"
			}], ephemeral: true
		});
		return;
	}

	var embedObj: APIEmbed[] = [];
	if (embed) try { embedObj.push( JSON.parse(embed) as APIEmbed ); }
	catch (error)
	{
		Debug.error(error);
		await interaction.reply({ embeds: [{ description: "Failed to parse the embed. Check the formatting!", author: Authors.Core }, {
			title: "Embed:",
			description: embed
		}], ephemeral: true });
		return;
	}

	var channelObj: TextChannel;
	try { channelObj = await interaction.guild.channels.fetch(channel.id) as TextChannel; }
	catch {
		await interaction.reply({
			embeds: [{ description: "Failed to find channel!", author: Authors.Core }], 
		ephemeral: true});
		return;
	}

	try
	{
		await channelObj.send({ embeds: embedObj });
		await interaction.reply({ embeds: [{ description: "Message has been sent!", author: Authors.Core }], ephemeral: true});
	}
	catch (error)
	{
		Debug.log("Failed to send message!", error);
		interaction.reply({ embeds: [{ description: "Could not sent message due to Discord API error!", author: Authors.Core }], ephemeral: true});
	}
}

/**
 * Send embed command. Sends an embedded message!
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName('send-embed')
			.setDescription('Sends an embedded message!')
			.addChannelOption(option =>
				option.setName('channel')
					.setDescription('Channel to send the message.')
					.setRequired(true))
			.addStringOption(option =>
				option.setName('embed')
					.setDescription('Embed to send with message.')
					.setRequired(true))
			.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
		sendEmbed
	]
} as BotModule;