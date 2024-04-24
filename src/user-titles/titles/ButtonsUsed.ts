import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.ButtonsUsed, {
	forwardTitle: "Button Pusher",
	// reverseTitle: "
	forwardDescription: "Most buttons used ({value})",
	// reverseDescription: "Least messages deleted ({value})",
});