import { BotModule } from "@/types";

import AddRoleMessageChatCommand from "./AddRoleMessageChatCommand";
import RemRoleMessageChatCommand from "./RemRoleMessageChatCommand";
import CreateRoleMessageChatCommand from "./CreateRoleMessageChatCommand";
import ChangeRoleButton from "./ChangeRoleButton";

/**
 * Module for role assignment.
 */
export default [

	AddRoleMessageChatCommand,
	RemRoleMessageChatCommand,
	CreateRoleMessageChatCommand,
	ChangeRoleButton

] as BotModule[];