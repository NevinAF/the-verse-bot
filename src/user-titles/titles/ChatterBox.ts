import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

/**
 * Most messages sent
 */
export default new UserEntryDataTitle(UserEntryData.MessagesCreated, {
	forwardTitle: "Chatter Box",
	reverseTitle: "Backseat Driver",
	forwardDescription: "Most messages sent ({value})",
	reverseDescription: "Least messages sent ({value})",
})