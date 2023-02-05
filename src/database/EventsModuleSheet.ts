import { BotModule, ModuleSheet, ModuleSheetEntry, WritableModuleSheetEntry } from "@/types";

export const EventsCategoryId = new ModuleSheetEntry("String", {
	rowStart: 1,
	columnStart: 1,
});

export const CompletedEvents = new WritableModuleSheetEntry("StringMatrix", {
	rowStart: 3,
	columnStart: 0,
	rowEnd: 10000,
	columnEnd: 2
});

/**
 * Module sheet entry for events
 */
export default new ModuleSheet("Events", [EventsCategoryId, CompletedEvents]);