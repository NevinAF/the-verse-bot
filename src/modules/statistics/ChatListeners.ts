import { BotModule } from "@/types";
import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";

export default {

	onInteractionCreate: [(i) =>
	{
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
	
	onMessageDelete: [(m) => UserData.incrementCell(m.guildId, {column: UserEntryData.UserID, compareValue: m.member.id}, UserEntryData.MessagesDeleted)],
	onMessageUpdate: [(o, n) => UserData.incrementCell(n.guildId, {column: UserEntryData.UserID, compareValue: n.member.id}, UserEntryData.MessagesEdited)],
	onMessageCreate: [(m) => UserData.incrementCell(m.guildId, {column: UserEntryData.UserID, compareValue: m.member.id}, UserEntryData.MessagesCreated)],

} as BotModule