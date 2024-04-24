import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.MessageReactionsRemoved, {
	forwardTitle: "Indecisive Reactor",
	forwardDescription: "Most reactions removed ({value})",
});