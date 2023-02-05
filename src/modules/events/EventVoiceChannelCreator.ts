import { BotModule } from "@/types";

import Debug from "@/debug";
import { Authors, Previewing } from "@/messaging";
import { ChannelType, Guild, GuildBasedChannel, GuildScheduledEvent, GuildScheduledEventStatus } from "discord.js";
import { CompletedEvents, EventsCategoryId } from "@/database/EventsModuleSheet";
import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";

class EventChecker
{
	private static eventCheckers: Map<string, EventChecker> = new Map();

	private static readonly createBefore = 1000 * 60 * 15; // 15 minutes

	private updateTimeOut?: NodeJS.Timeout;
	private readonly guild: Guild;

	public eventChannels: Map<string, {
		channelId: string,
		channelName: string,
		attendees: string[],
	}>;

	public constructor(guild: Guild)
	{
		this.guild = guild;
		this.eventChannels = new Map();
	}
	
	public async update()
	{
		if (this.updateTimeOut)
		{
			// Clear the timeout
			clearTimeout(this.updateTimeOut);
			this.updateTimeOut = undefined;
		}

		if (!this.guild.available)
		{
			Debug.warning(`Guild '${this.guild.name}' is not available.`);
			return;
		}

		const [events, createCategory] = await Promise.all([
			this.guild.scheduledEvents.fetch(),
			EventsCategoryId.fetch(this.guild.id)
				.then((id) => this.guild.channels.fetch(id))
				.catch(() => null),
		]);

		if (!createCategory || createCategory.type !== ChannelType.GuildCategory)
		{
			Debug.warning(`No category set for event voice channels in guild ${this.guild.id}`);
			return;
		}

		const currentTime = Date.now();
		let nextUpdateTime: number = currentTime + 1000 * 60 * 60 * 24; // 24 hours
		

		for await (const event of events.values())
		{
			const eventData = this.eventChannels.get(event.id);

			if (eventData)
			{
				if (event.scheduledEndTimestamp && (event.status === GuildScheduledEventStatus.Active || event.scheduledEndTimestamp > currentTime))
				{
					if (event.scheduledEndTimestamp < nextUpdateTime)
					{
						nextUpdateTime = event.scheduledEndTimestamp;
					}
					continue;
				}

				// Event is over
				Debug.event("Evt End", `Event ${event.name} is over, deleting channel and updating sheet.`);

				const channel = await this.guild.channels.fetch(eventData.channelId, { force: true });
				this.eventChannels.delete(event.id);
				
				if (channel && channel.type === ChannelType.GuildVoice)
				{
					if (channel.members.size === 0)
					{
						eventData.attendees.forEach((userId) => UserData.incrementCell(this.guild.id, { compareValue: userId, column: UserEntryData.UserID }, UserEntryData.EventsAttended));
						await CompletedEvents.fetch(this.guild.id).then((data) => data.push([
							event.name,
							eventData.attendees.length.toString(),
							(currentTime - channel.createdTimestamp).toString()
						]));
						await channel.delete();
					}
				}
				continue;
			}

			if (!event.scheduledStartTimestamp)
			{
				continue;
			}

			const createTime = event.scheduledStartTimestamp - EventChecker.createBefore;
			const loc = event.entityMetadata?.location?.trim();
			if (!loc || !loc.toLowerCase().startsWith("vc:"))
				continue;

			const channelName = loc.substring(3).trim();

			if (currentTime < createTime)
			{
				if (createTime < nextUpdateTime)
				{
					nextUpdateTime = createTime;
				}

				// Delete events that are not ongoing
				let eventChannel: string | undefined;
				for (const [, eventData] of this.eventChannels)
				{
					if (eventData.channelName === channelName)
					{
						eventChannel = eventData.channelId;
						break;
					}
				}

				await Promise.all(createCategory.children.cache.map((channel) =>
				{
					if (channel.type === ChannelType.GuildVoice && channel.name === channelName && (!eventChannel || channel.id !== eventChannel))
					{
						return channel.delete();
					}
				}));

				continue;
			}

			if (channelName.length === 0)
			{
				Debug.warning(`Event ${event.id} has no channel name but is marked as a voice channel event`);
				continue;
			}
			
			const existingChannel = createCategory.children.cache.find((channel) => channel.type === ChannelType.GuildVoice && channel.name === channelName);

			if (existingChannel)
			{
				Debug.warning(`Channel ${channelName} already exists, using that instead of creating a new one.`);
				this.eventChannels.set(event.id, {
					channelId: existingChannel.id,
					channelName,
					attendees: [],
				});
				continue;
			}

			Debug.event("Evt Bgn", `Event ${event.name} is beginning, creating channel and sending event channel message: parent: ${createCategory.id}, name: ${channelName}`);

			const channel = await createCategory.children.create({
				name: channelName,
				type: ChannelType.GuildVoice,
				reason: `Event: ${event.name}`
			}).catch(Debug.error);

			if (!channel)
			{
				Debug.error(`Failed to create channel for event ${event.name}`);
				continue;
			}

			Debug.log(`Created channel ${channel?.id} for event ${event.name}`);

			this.eventChannels.set(event.id, {
				channelId: channel.id,
				channelName: channel.name,
				attendees: []
			});

			await channel.send({
				content: event.url,
				embeds: [{
					author: Authors.Events,
					description: "This channel was created for an event and will be deleted along with any text shared here when the event ends (event time ends and everyone leaves).",
					color: 0x00ffff,
				}]
			});

			if (event.scheduledEndTimestamp && event.scheduledEndTimestamp < nextUpdateTime)
			{
				nextUpdateTime = event.scheduledEndTimestamp;
			}
		}

		Debug.log(`Next event check for ${this.guild.name} in ${Previewing.msToHuman(nextUpdateTime - currentTime)}`);

		this.updateTimeOut = setTimeout(() => this.update(), (nextUpdateTime - Date.now()) + 100);
	}

	public static tryAddUserToEvent(guild?: Guild, channelId?: string, userId?: string)
	{
		if (!guild || !channelId || !userId)
		{
			return;
		}

		return EventChecker.updateChecker(guild).then((checker) =>
		{
			const currentEvents = checker?.eventChannels.values() ?? [];
			for (const eventData of currentEvents)
			{
				if (eventData.channelId === channelId)
				{
					if (eventData.attendees.includes(userId))
						return;
					eventData.attendees.push(userId);
					return;
				}
			}
		});
	}

	public static userInEvent(guild: Guild, channelId: string, userId: string)
	{
		return EventChecker.updateChecker(guild).then((checker) =>
		{
			const currentEvents = checker?.eventChannels.values() ?? [];
			for (const eventData of currentEvents)
			{
				if (eventData.channelId === channelId)
				{
					return eventData.attendees.includes(userId);
				}
			}
			return false;
		});
	}

	public static updateChecker(guild: Guild | null): Promise<EventChecker | undefined>
	{
		if (!guild)
		{
			return Promise.resolve(undefined);
		}

		let checker = EventChecker.eventCheckers.get(guild.id);
		if (!checker)
		{
			checker = new EventChecker(guild);
			EventChecker.eventCheckers.set(guild.id, checker);
		}

		return checker.update().then(() => checker);
	}
}

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