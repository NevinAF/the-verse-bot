import { BotModule } from "@/types";

import CommandRegister from "./CommandRegister";
import BotStatsChatCommand from "./BotStatsChatCommand";
import ListRoleMembersChatCommand from "./ListRoleMembersChatCommand";
import ShowMessageChatCommand from "./ShowMessageChatCommand";
import NullCallButton from "./NullCallButton";
import NonImplementButton from "./NonImplementButton";
import SendEmbedChatMessage from "./SendEmbedChatMessage";
import EditEmbedChatCommand from "./EditEmbedChatCommand";
import PingChatCommand from "./PingChatCommand";
import ForceBackupChatCommand from "./ForceBackupChatCommand";
import RefreshModuleSheetsChatCommand from "./RefreshModuleSheetsChatCommand";


export default [
	CommandRegister,
	BotStatsChatCommand,
	ListRoleMembersChatCommand,
	ShowMessageChatCommand,
	NullCallButton,
	NonImplementButton,
	SendEmbedChatMessage,
	EditEmbedChatCommand,
	PingChatCommand,
	ForceBackupChatCommand,
	RefreshModuleSheetsChatCommand
] as BotModule[];