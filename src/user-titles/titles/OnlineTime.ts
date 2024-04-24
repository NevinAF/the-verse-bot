import { UserEntryData } from "@/database/UserDataModuleSheet";
import { Previewing } from "@/messaging";
import { Title, UserEntryDataTitle } from "../common";

/**
 * Longest time online
 */
export default new UserEntryDataTitle(UserEntryData.OnlineTime, {
	forwardTitle: "Online Oba",
	forwardDescription: "Bulk time 'online' ({value})",
	valueFormatter: Title.formatDuration,
});