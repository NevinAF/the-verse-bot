import { BotModule, ModuleSheet, ModuleSheetEntry, WritableModuleSheetEntry } from "@/types";

export const BotLogChannelId = new ModuleSheetEntry("String", {
	rowStart: 1,
	columnStart: 1,
});

export const FallbackRecordingChannelId = new ModuleSheetEntry("String", {
	rowStart: 2,
	columnStart: 1,
});

/**
 * Module sheet entry for events
 */
export default new ModuleSheet("Channels", [BotLogChannelId, FallbackRecordingChannelId]);