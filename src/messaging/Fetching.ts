import ClientWrapper from "@/ClientWrapper";
import Debug from "@/debug";
import { APIInteractionGuildMember, BaseInteraction, ButtonInteraction, CacheType, Client, CommandInteraction, Guild, GuildMember, GuildMemberRoleManager, Interaction, Message, PermissionResolvable, PermissionsBitField, TextChannel } from "discord.js";
import Authors from "./Authors";

namespace Fetching
{
	async function _interactionMember(cmd: CommandInteraction | ButtonInteraction, message: string): Promise<GuildMember | null>
	{
		if (!cmd.guild) return null;
		if (!cmd.member) return null;

		let member = cmd.guild.members.cache.get(cmd.member.user.id);

		if (member != null)
		{
			return member;
		}

		Debug.log(`Fetching member ${cmd.member.user.id} from guild ${cmd.guild.id} for command interaction...`);

		return await cmd.guild.members.fetch(cmd.user)
			.catch(_ => cmd.reply({ embeds: [{ author: Authors.Error, description: "Internal error 204 getting the data to " + message }], ephemeral: true }))
			.then(_ => null);
	}


	export function commandMember(cmd: CommandInteraction): Promise<GuildMember | null>
	{
		return _interactionMember(cmd, "execute the command");
	}

	export function buttonMember(cmd: ButtonInteraction): Promise<GuildMember | null>
	{
		return _interactionMember(cmd, "use the button");
	}

	export async function buttonMessage(button: ButtonInteraction): Promise<Message | null>
	{
		if (!button.channel) return null;

		let msg = button.channel.messages.cache.get(button.message.id);

		if (msg != null)
		{
			return msg;
		}

		Debug.log("Fetching button message from API");

		return await button.channel.messages.fetch(button.message.id)
			.catch(_ => button.reply({ embeds: [{ author: Authors.Error, description: "Internal error 205 getting the data to use the button" }], ephemeral: true }))
			.then(_ => null);
	}


	// This is an AND check, not an OR check
	export async function interactionPermissions(interaction: BaseInteraction, permissions: PermissionResolvable): Promise<boolean>
	{
		if (!interaction.guild) return false;
		if (!interaction.member) return false;

		let has = (interaction.member.permissions as PermissionsBitField)?.has(permissions);
		if (has != null) return has;

		Debug.log("Fetching interaction permissions");

		return await interaction.guild.members.fetch(interaction.user)
			.then(member => member.permissions.has(permissions))
			.catch(error =>
			{
				Debug.error("There was a problem fetching a member to check permissions. Returning false for permissions.", error);
				return false;
			});
	}

	// This is an OR check, not an AND check
	export async function interactionRoles(interaction: BaseInteraction, roles: string[]): Promise<boolean>
	{
		if (!interaction.guild) return false;
		if (!interaction.member) return false;

		let has = (interaction.member.roles as GuildMemberRoleManager)?.cache.some(role => roles.includes(role.id));
		if (has) return has;

		Debug.log("Fetching interaction roles");

		return await interaction.guild.members.fetch(interaction.user)
			.then(member => member.roles.cache.some(role => roles.includes(role.id)))
			.catch(error =>
			{
				Debug.error("There was a problem fetching a member to check roles. Returning false for roles.", error);
				return false;
			});
	}

	export function MessageFromURL(msg_url: string | null): Promise<Message<boolean>>
	{
		return new Promise(async (resolve, reject) =>
		{
			if (!msg_url)
			{
				reject("message-url not provided");
				return;
			}

			const msglink_split = msg_url.match(/[0-9]{10,20}/g);

			var msg: Message<boolean> | null;

			try
			{
				if (msglink_split && msglink_split.length == 3)
					msg = await ClientWrapper.Client.guilds.fetch(msglink_split[0])
						.then(guild => guild.channels.fetch(msglink_split[1]) as Promise<TextChannel>)
						.then(channel => channel.messages.fetch(msglink_split[2]))
						.catch(_ => null);

				else if (msglink_split && msglink_split.length == 2 &&
						msg_url.startsWith("https://discord.com/channels/@me/"))
				{
					let channel = await ClientWrapper.Client.channels.fetch(msglink_split[0]) as TextChannel;
					msg = await channel.messages.fetch(msglink_split[1]);
				}
				else
				{
					reject("Message URL was not valid. Make sure the link is from a message.");
					return;
				}
			} catch
			{
				reject("Message URL looked correct but could not be found.");
				return;
			}

			if (msg)
				resolve(msg);
			else Debug.error(new Error("Message should never be null! Promise is not going to resolve..."));
		});
	}
}

export default Fetching;