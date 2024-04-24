import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

/**
 * Most Events Attended
 */
export default new UserEntryDataTitle(UserEntryData.EventsAttended, {
	forwardTitle: "Meeting FOMO", 
	reverseTitle: "Event Avoider",
	forwardDescription: "Most Discord Events attended ({value})",
	reverseDescription: "Least Discord Events attended ({value})",
})