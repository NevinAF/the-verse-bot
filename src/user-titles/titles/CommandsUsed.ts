import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.ChatCommandsUsed, {
	forwardTitle: "Chat Commander",
	// reverseTitle: "
	forwardDescription: "Most chat commands used ({value})",
	// reverseDescription: "Least messages deleted ({value})",
});