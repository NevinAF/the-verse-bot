import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.MemberMentions, {
	forwardTitle: "Notification Sniper",
	// reverseTitle: "
	forwardDescription: "Most personal `@`s ({value})",
	// reverseDescription: "Least messages sent ({value})",
})