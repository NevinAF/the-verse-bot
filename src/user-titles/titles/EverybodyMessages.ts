import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.EveryoneMentions, {
	forwardTitle: "Notification Bombardier",
	// reverseTitle: "
	forwardDescription: "Most `@everybody`s ({value})",
	// reverseDescription: "Least messages sent ({value})",
})