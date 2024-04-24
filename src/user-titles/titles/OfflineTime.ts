import { UserEntryData } from "@/database/UserDataModuleSheet";
import { Previewing } from "@/messaging";
import { Title, UserEntryDataTitle } from "../common";

/**
 * Longest time online
 */
export default new UserEntryDataTitle(UserEntryData.OfflineTime, {
	forwardTitle: "Offline time-off",
	forwardDescription: "Bulk time 'offline' ({value})",
	valueFormatter: Title.formatDuration,
});