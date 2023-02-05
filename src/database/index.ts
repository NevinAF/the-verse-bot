import { ModuleSheet } from "@/types";
import EventsModuleSheet from "./EventsModuleSheet";
import RolesModuleSheet from "./RolesModuleSheet";
import UserDataModuleSheet from "./UserDataModuleSheet";

/**
 * The sheets for the bot.
 */
export default [

	EventsModuleSheet,
	RolesModuleSheet,
	UserDataModuleSheet

] as ModuleSheet[];