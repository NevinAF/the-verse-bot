import ClientWrapper from "@/ClientWrapper";
import { BotModule } from "@/types";

/**
 * Register all commands to the guilds
 */
export default {

	onReady: [(client) =>
	{
		for (const guild of client.guilds.cache.values())
		{
			ClientWrapper.Instance.pushCommands(guild.id);
		}
	}],

	registerGuildCreate: [(guild) => ClientWrapper.Instance.pushCommands(guild.id)]

} as BotModule;