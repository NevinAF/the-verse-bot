import { BotModule } from "@/types";
import GratitudeShoutoutChatCommand from "./GratitudeShoutoutChatCommand";
import MusicShoutoutChatCommand from "./MusicShoutoutChatCommand";

export default [
	GratitudeShoutoutChatCommand,
	MusicShoutoutChatCommand
] as BotModule[];