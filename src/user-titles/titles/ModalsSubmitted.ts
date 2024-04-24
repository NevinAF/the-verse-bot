import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.ModalsSubmitted, {
	forwardTitle: "Application Addict",
	// reverseTitle: "
	forwardDescription: "Most Discord forms submitted ({value})",
	// reverseDescription: "Least messages deleted ({value})",
});