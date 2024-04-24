import { UserEntryData } from "@/database/UserDataModuleSheet";
import { Previewing } from "@/messaging";
import { Title, UserEntryDataTitle } from "../common";

/**
 * Longest time online
 */
export default new UserEntryDataTitle(UserEntryData.VCTime, {
	forwardTitle: "Voice Chatter",
	forwardDescription: "Bulk time in VC ({value})",
	valueFormatter: (value) => Title.formatDuration(value, true),
});