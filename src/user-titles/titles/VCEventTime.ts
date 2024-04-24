import { UserEntryData } from "@/database/UserDataModuleSheet";
import { Previewing } from "@/messaging";
import { Title, UserEntryDataTitle } from "../common";

/**
 * Most Events Attended
 */
export default new UserEntryDataTitle(UserEntryData.VCEventsTime, {
	forwardTitle: "Event Addict",
	reverseTitle: "Event Dropout",
	forwardDescription: "Most time in Discord Events ({value})",
	reverseDescription: "Least time in Discord Events ({value})",
	valueFormatter: (value) => Title.formatDuration(value, true),
})