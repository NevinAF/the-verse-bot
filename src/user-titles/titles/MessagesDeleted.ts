import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.MessagesDeleted, {
	forwardTitle: "-Redacted-",
	reverseTitle: "Historian",
	forwardDescription: "Most messages deleted ({value})",
	reverseDescription: "Least messages deleted ({value})",
});