import { ModuleSheet, WritableColumnedMatrixSheet, WritableModuleSheetEntry } from "@/types";

export enum UserEntryData
{
	UserID,
	Handle,
	CurrentMember,
	FullName,
	Pronouns,
	Email,
	Phone,
	Bio,
	Location,
	Timezone,
	Color,

	OnlineTime,
	IdleTime,
	DNDTime,
	OfflineTime,

	VCTime,
	EventsAttended,
	VCEventsTime,
	LastToLeaveVC,

	MessagesCreated,
	MessageReplies,
	MemberMentions,
	RoleMentions,
	ChannelMentions,
	EveryoneMentions,
	MessageEmojis,

	MessagesEdited,
	MessagesDeleted,

	MessageReactionsAdded,
	// MessageReactionsAddedOverOne,
	MessageReactionsRemoved,
	MessageReactionsGotten,
	FastMessageReactions,

	ButtonsUsed,
	ChatCommandsUsed,
	ModalsSubmitted,
	MessageContextMenusUsed,
	UserContextMenusUsed,

	__Length__
}

export const UserData = new WritableColumnedMatrixSheet({
	rowStart: 2,
	columnStart: 0,
	rowEnd: 10000,
	columnEnd: UserEntryData.__Length__ - 1,
});

export default new ModuleSheet("UserData", [
	UserData
]);