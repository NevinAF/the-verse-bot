import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

/**
 * Most reactions added
 */
export default new UserEntryDataTitle(UserEntryData.MessageReactionsAdded, {
	forwardTitle: "Drama King",
	reverseTitle: "Emotional Potato",
	forwardDescription: "Most emoji reactions ({value})",
	reverseDescription: "Least emoji reactions ({value})",
});