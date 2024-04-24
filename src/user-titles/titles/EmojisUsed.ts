import { UserEntryData } from "@/database/UserDataModuleSheet";
import { UserEntryDataTitle } from "../common";

export default new UserEntryDataTitle(UserEntryData.MessageEmojis, {
	forwardTitle: "Emoter",
	reverseTitle: "Emojiless",
	forwardDescription: "Most emojis used ({value})",
	reverseDescription: "Least emojis used ({value})",
})