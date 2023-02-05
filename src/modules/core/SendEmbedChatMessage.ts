import Debug from "@/debug";
import { Authors } from "@/messaging";
import { BotModule } from "@/types";
import { SlashCommandBuilder, CommandInteraction, CacheType, APIEmbed, TextChannel, PermissionsBitField } from "discord.js";

async function sendEmbed(interaction: CommandInteraction<CacheType>)
{
	const channel = interaction.options.get("channel").channel;
	const embed: string = interaction.options.get("embed").value as string;

	var embedObj: APIEmbed[] = [];
	if (embed) try { embedObj.push( JSON.parse(embed) as APIEmbed ); }
	catch (error)
	{
		Debug.error(error);
		interaction.reply({ embeds: [{ description: "Failed to parse the embed. Check the formatting!", author: Authors.Core }, {
			title: "Embed:",
			description: embed
		}], ephemeral: true });
		return;
	}

	var channelObj: TextChannel;
	try { channelObj = await interaction.guild.channels.fetch(channel.id) as TextChannel; }
	catch { interaction.reply({embeds: [{ description: "Failed to find channel!", author: Authors.Core }], 
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