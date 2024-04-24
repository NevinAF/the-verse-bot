import { BotModule } from "@/types";
import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";
import { MessageType } from "discord.js";
import { RegexpLib } from "@/util/RegexpLib";

export default {

	onInteractionCreate: [(i) =>
	{
		if (!i.guildId) return;

		if (i.isUserContextMenuCommand())
			UserData.incrementCell(i.guildId, {column: UserEntryData.UserID, compareValue: i.user.id}, UserEntryData.UserContextMenusUsed);
		else if (i.isMessageContextMenuCommand())
			UserData.incrementCell(i.guildId, {column: UserEntryData.UserID, compareValue: i.user.id}, UserEntryData.MessageContextMenusUsed);
		else if (i.isCommand())
			UserData.incrementCell(i.guildId, {column: UserEntryData.UserID, compareValue: i.user.id}, UserEntryData.ChatCommandsUsed);
		else if (i.isButton())
			UserData.incrementCell(i.guildId, {column: UserEntryData.UserID, compareValue: i.user.id}, UserEntryData.ButtonsUsed);
		else if (i.isModalSubmit())
			UserData.incrementCell(i.guildId, {column: UserEntryData.UserID, compareValue: i.user.id}, UserEntryData.ModalsSubmitted);
	}],
	
	onMessageDelete: [(m) =>
	{
		if (m.guildId && m.member)
			UserData.incrementCell(m.guildId, { column: UserEntryData.UserID, compareValue: m.member.id }, UserEntryData.MessagesDeleted)
	}],
	onMessageUpdate: [(o, n) =>
	{
		if (n.guildId && n.member)
			UserData.incrementCell(n.guildId, { column: UserEntryData.UserID, compareValue: n.member.id }, UserEntryData.MessagesEdited)
	}],
	onMessageCreate: [(m) =>
	{
		if (m.guildId && m.member)
		{
			const promises: Promise<any>[] = [];
			promises.push(
				UserData.incrementCell(m.guildId, { column: UserEntryData.UserID, compareValue: m.member.id }, UserEntryData.MessagesCreated)
			);
			if (m.mentions.members?.size)
			{
				promises.push(
					UserData.incrementCell(m.guildId, { column: UserEntryData.UserID, compareValue: m.member.id }, UserEntryData.MemberMentions, m.mentions.members.size)
				);
			}

			if (m.mentions.roles?.size)
			{
				promises.push(
					UserData.incrementCell(m.guildId, { column: UserEntryData.UserID, compareValue: m.member.id }, UserEntryData.RoleMentions, m.mentions.roles.size)
				);
			}

			if (m.mentions.channels?.size)
			{
				promises.push(
					UserData.incrementCell(m.guildId, { column: UserEntryData.UserID, compareValue: m.member.id }, UserEntryData.ChannelMentions, m.mentions.channels.size)
				);
			}

			if (m.mentions.everyone)
			{
				promises.push(
					UserData.incrementCell(m.guildId, { column: UserEntryData.UserID, compareValue: m.member.id }, UserEntryData.EveryoneMentions)
				);
			}

			if (m.type == MessageType.Reply)
			{
				promises.push(
					UserData.incrementCell(m.guildId, { column: UserEntryData.UserID, compareValue: m.member.id }, UserEntryData.MessageReplies)
				);
			}

			// Find all emojis in the message
			const emojis = m.content.match(RegexpLib.emojiRegex);
			if (emojis)
			{
				promises.push(
					UserData.incrementCell(m.guildId, { column: UserEntryData.UserID, compareValue: m.member.id }, UserEntryData.MessageEmojis, emojis.length)
				);
			}

			return Promise.all(promises);
		}
	}],

} as BotModule