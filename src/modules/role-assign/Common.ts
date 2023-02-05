import Debug from "@/debug";
import { Authors, Buttons, Fetching } from "@/messaging";
import QuickReplies from "@/messaging/QuickReplies";
import { APIMessageComponentEmoji, BaseMessageOptions, ButtonStyle, ChatInputCommandInteraction, ComponentType, Guild, InteractionCollector, Message } from "discord.js";
import { RoleDescriptions, RoleEmojis, RoleIds } from "../../database/RolesModuleSheet";

export async function createRoleMessageEmbed(guild: Guild, title: string, desc: string, roles: string[]): Promise<BaseMessageOptions>
{
	const roleData: [name: string, members: number, desc: string, emoji: APIMessageComponentEmoji, emoji_string: string][] = [];
	
	const [ids, descs, emojis, members] = await Promise.all([
		RoleIds.fetch(guild.id),
		RoleDescriptions.fetch(guild.id),
		RoleEmojis.fetch(guild.id),
		guild.members.fetch()
	]);

	const guild_roles = await guild.roles.fetch();

	for (const role_resolvable of roles)
	{
		const role = guild_roles.find(r => r.name === role_resolvable || r.id === role_resolvable);

		if (!role)
		{
			Debug.warning(`Could not find '${role_resolvable}' as a role.`);
			continue;
		}

		const role_id = role.id;
		const role_index = ids.indexOf(role_id);

		if (role_index === -1)
		{
			Debug.warning(`Role '${role_resolvable}' does not exist in the roles sheet. Ids: ${ids.join(", ")}`);
			continue;
		}

		const role_size = members.filter(member => member.roles.cache.has(role.id)).size;
		let emoji: APIMessageComponentEmoji;
		const emoji_regex = emojis[role_index].match(/<a?:(\w+):(\d+)>/);

		if (emoji_regex)
		{
			emoji = {
				id: emoji_regex[2],
				name: emoji_regex[1]
			};
		}
		else
		{
			emoji = { name: emojis[role_index] };
		}

		roleData.push([
			role.name,
			role_size,
			descs[role_index],
			emoji,
			emojis[role_index]
		]);
	}

	return {
		embeds: [{
			author: Authors.RoleAssign,
			title: title,
			description: desc,
			fields: roleData.map(([role, members, desc, emoji, e_string]) => ({
				name: `${e_string} ${role} (${members})`,
				value: desc,
				inline: true
			})),
			color: 0x00ff00,
			footer: { text: "Click on the buttons to assign yourself a role." }
		}],
		components: Buttons.toNiceActionRows(
			roleData.map(([role, members, desc, emoji, e_string], index) => ({
				type: ComponentType.Button,
				label: `${role}`,
				emoji: emoji,
				custom_id: "changeRole_" + index,
				style: ButtonStyle.Primary
			}))
		)
	};
}

export function updateRoleMessageEmbed(message: Message, add?: boolean, role?: string)
{
	return createRoleMessageEmbed(
		// @ts-ignore
		message?.guild,
		message.embeds[0].title,
		message.embeds[0].description,
		message.embeds[0].fields.map(field =>
			field.name.substring(
				field.name.indexOf(" ") + 1,
				field.name.lastIndexOf(" ")))
			.concat(((add ?? false) && role) ? role : [])
			.filter(r => r !== role || (add ?? true))
	).then(content => message.edit(content));
}

export async function editRoleMessage(interaction: ChatInputCommandInteraction, add: boolean)
{
	const role = interaction.options.getRole("role");
	const message_resolvable = interaction.options.getString("message");

	if (!role || !message_resolvable)
	{
		return await interaction.reply(QuickReplies.interactionError("Invalid role or message."));
	}

	if (!interaction.channel)
	{
		return await interaction.reply(QuickReplies.interactionError("Invalid channel."));
	}

	let message: Message;

	if (message_resolvable.toLowerCase().startsWith("https://discord.com/channels/"))
	{
		message = await Fetching.MessageFromURL(message_resolvable);
	}
	else message = await interaction.channel.messages.fetch(message_resolvable);

	if (!message) return interaction.reply({
		embeds: [{
			author: Authors.Error,
			description: "The message that you have specified does not exist."
		}], ephemeral: true
	});

	if (message.author.id !== interaction.client.user.id) return interaction.reply({
		embeds: [{
			author: Authors.Error,
			description: "The message that you have specified is not a message that was sent by the bot."
		}], ephemeral: true
	});

	if (message.embeds.length === 0) return interaction.reply({
		embeds: [{
			author: Authors.Error,
			description: "The message that you have specified does not have any embeds."
		}], ephemeral: true
	});

	if (!message.embeds[0].author || message.embeds[0].author.name !== "Role Assign") return interaction.reply({
		embeds: [{
			author: Authors.Error,
			description: "The message that you have specified is not a role assign message."
		}], ephemeral: true
	});

	const deferred = interaction.deferReply({ ephemeral: true });

	await updateRoleMessageEmbed(message, add, role.id);
	await deferred;
	await interaction.editReply(`${add ? "Added" : "Removed"} role <@&${role.id}> ${add ? "to" : "from"} the message.`).catch(() => { });;
}