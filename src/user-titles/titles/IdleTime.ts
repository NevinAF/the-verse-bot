import { UserEntryData } from "@/database/UserDataModuleSheet";
import { Previewing } from "@/messaging";
import { Title, UserEntryDataTitle } from "../common";

/**
 * Longest time online
 */
export default new UserEntryDataTitle(UserEntryData.IdleTime, {
	forwardTitle: "Idler",
	forwardDescription: "Bulk time 'idle' ({value})",
	valueFormatter: Title.formatDuration,
});