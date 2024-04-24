import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

/**
 * Most messages sent
 */
export default new UserEntryDataTitle(UserEntryData.RoleMentions, {
	forwardTitle: "Notification Rocketeer",
	// reverseTitle: "
	forwardDescription: "Most role `@`s ({value})",
	// reverseDescription: "Least messages sent ({value})",
})