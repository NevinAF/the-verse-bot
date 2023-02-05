import { BotModule, ModuleSheet, ModuleSheetEntry } from "@/types";

// export const RoleNames: ;
export const RoleIds = new ModuleSheetEntry("StringArray", {
	rowStart: 2,
	rowEnd: 5000,
	columnStart: 1,
});

export const RoleEmojis = new ModuleSheetEntry("StringArray", {
	rowStart: 2,
	rowEnd: 5000,
	columnStart: 2,
});

export const RoleDescriptions = new ModuleSheetEntry("StringArray", {
	rowStart: 2,
	rowEnd: 5000,
	columnStart: 3,
});

export const InternalMemberRole = new ModuleSheetEntry("String", {
	rowStart: 1,
	columnStart: 6,
});

export const AutoRecordRole = new ModuleSheetEntry("String", {
	rowStart: 2,
	columnStart: 6,
});

/**
 * The role descriptions for the bot.
 */
export default new ModuleSheet("Roles", [
	RoleIds,
	RoleEmojis,
	RoleDescriptions,
	InternalMemberRole,
	AutoRecordRole
])