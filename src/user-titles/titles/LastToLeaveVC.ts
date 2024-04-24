import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.LastToLeaveVC, {
	forwardTitle: "Door Holder",
	// reverseTitle: "Door Runner",
	forwardDescription: "Last to leave VC w/ people ({value} times)",
	// reverseDescription: "Least messages sent ({value})",
})