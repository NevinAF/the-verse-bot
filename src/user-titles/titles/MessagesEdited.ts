import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.MessagesEdited, {
	forwardTitle: "Editor",
	reverseTitle: "Fundamentalist",
	forwardDescription: "Most messages edited ({value})",
	reverseDescription: "Least messages edited ({value})",
})