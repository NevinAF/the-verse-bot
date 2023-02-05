import { BotModule } from "@/types";
import { EventChecker } from "@/stats";

/**
 * Module for managing event voice channels
 */
export default {

	onReady: [async (client) =>
	{
		for await (const guild of client.guilds.cache.values())
		{
			EventChecker.updateChecker(guild);
		}
	}],

	registerGuildCreate: [async (guild) => EventChecker.updateChecker(guild)],

	registerGuildScheduledEventCreate: [async (event) => EventChecker.updateChecker(event.guild)],
	registerGuildScheduledEventDelete: [async (event) => EventChecker.updateChecker(event.guild)],
	registerGuildScheduledEventUpdate: [async (oldEvent, newEvent) => EventChecker.updateChecker(newEvent.guild)],

	registerVoiceStateUpdate: [async (oldState, newState) =>
	{
		if (oldState.channelId === newState.channelId)
			return;

		EventChecker.tryAddUserToEvent(newState.guild, newState.channelId ?? undefined, newState.id);
	}]


} as BotModule;