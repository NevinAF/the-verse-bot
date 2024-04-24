import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.ChannelMentions, {
	forwardTitle: "Channel Mentioner",
	forwardDescription: "Most channel mentions ({value})",
})