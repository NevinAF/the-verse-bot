import { UserEntryData } from "@/database/UserDataModuleSheet";
import { Previewing } from "@/messaging";
import { Title, UserEntryDataTitle } from "../common";

/**
 * Longest time online
 */
export default new UserEntryDataTitle(UserEntryData.DNDTime, {
	forwardTitle: "Busy Bee",
	forwardDescription: "Bulk time 'DND' ({value})",
	valueFormatter: Title.formatDuration,
});