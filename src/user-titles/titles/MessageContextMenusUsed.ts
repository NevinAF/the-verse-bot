import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.MessageContextMenusUsed, {
	forwardTitle: "Message Commander",
	// reverseTitle: "
	forwardDescription: "Most message context menus used ({value})",
	// reverseDescription: "Least messages deleted ({value})",
});