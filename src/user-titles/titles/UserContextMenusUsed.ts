import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.UserContextMenusUsed, {
	forwardTitle: "User Menu Commander",
	// reverseTitle: "
	forwardDescription: "Most user context menus used ({value})",
	// reverseDescription: "Least messages deleted ({value})",
});