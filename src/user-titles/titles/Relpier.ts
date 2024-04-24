import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

/**
 * Most messages sent
 */
export default new UserEntryDataTitle(UserEntryData.MessageReplies, {
	forwardTitle: "Reply Organizer",
	// reverseTitle: "",
	forwardDescription: "Most message replies ({value})",
	// reverseDescription: "",
});