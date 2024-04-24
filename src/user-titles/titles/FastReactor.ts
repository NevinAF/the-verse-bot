import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

/**
 * Most reactions added in under 15 minutes of a message being posted
 */
export default new UserEntryDataTitle(UserEntryData.FastMessageReactions, {
	forwardTitle: "Fast Reactor",
	reverseTitle: "Slow Reactor",
	forwardDescription: "Reactions within 15m ({value})",
	reverseDescription: "Reactions within 15m ({value})",
});