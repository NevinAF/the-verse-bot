import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.MessageReactionsGotten, {
	forwardTitle: "Popular Kid",
	// reverseTitle: "Unpopular Kid",
	forwardDescription: "Most reactions received ({value})",
	// reverseDescription: "Least messages deleted ({value})",
});