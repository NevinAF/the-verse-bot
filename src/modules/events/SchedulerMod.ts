import { ActionRowBuilder, APIButtonComponent, ApplicationCommandType, ButtonStyle, CacheType, ChatInputCommandInteraction, Collection, ComponentType, ContextMenuCommandBuilder, Emoji, GuildScheduledEvent, GuildScheduledEventStatus, ModalBuilder, ModalSubmitInteraction, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { BotModule } from "@/types";
import { Authors, Buttons, Emojis, Previewing, TimeParser } from "@/messaging";
import { GoogleCalendar } from "@/apis";
import Debug from "@/debug";

const modalId = "scheduler-modal";

interface EventData {
	title?: string, description?: string, location?: string, time?: string
}

function createModal({
	title, description, location, time
}: EventData, previewStartTime?: string, previewEndTime?: string): ModalBuilder
{
	const titleText = new TextInputBuilder()
		.setCustomId('event_name')
		.setStyle(TextInputStyle.Short)
		.setMinLength(1)
		.setMaxLength(100)
		.setRequired(true)
		.setLabel('Event Name');
	
	if (title)
		titleText.setValue(title);
	else titleText.setPlaceholder("Event Name");

	const descriptionText = new TextInputBuilder()
		.setCustomId('event_description')
		.setStyle(TextInputStyle.Paragraph)
		.setMinLength(1)
		.setMaxLength(1000)
		.setRequired(false)
		.setLabel('Event Description');
	
	if (description)
		descriptionText.setValue(description);
	else descriptionText.setPlaceholder("Event Description");

	const locationText = new TextInputBuilder()
		.setCustomId('event_location')
		.setStyle(TextInputStyle.Short)
		.setMaxLength(100)
		.setRequired(false)
		.setLabel('Event Location');
	
	if (location)
		locationText.setValue(location);
	else locationText.setPlaceholder("Event Location");

	const previewTime = (previewStartTime ? ": " + previewStartTime + (previewEndTime ? " - " + previewEndTime : "") + " PST" : "");
	Debug.log("Preview time (" + previewTime.length + "): " + previewTime);

	const timeText = new TextInputBuilder()
		.setCustomId('event_time')
		.setStyle(TextInputStyle.Short)
		.setMinLength(1)
		.setMaxLength(100)
		.setRequired(true)
		.setLabel('Time' + previewTime);

	if (time)
		timeText.setValue(time);
	else timeText.setPlaceholder("Event Time");

	return new ModalBuilder()
		.setCustomId(modalId)
		.setTitle('Create Event')
		.addComponents(
			new ActionRowBuilder({
				type: ComponentType.ActionRow,
				components: [ titleText ]
			}),
			new ActionRowBuilder({
				type: ComponentType.ActionRow,
				components: [ timeText ],
			}),
			new ActionRowBuilder({
				type: ComponentType.ActionRow,
				components: [ descriptionText ],
			}),
			new ActionRowBuilder({
				type: ComponentType.ActionRow,
				components: [ locationText ],
			}),
		);
}

let lastFailedEvent: [lastUser: string, data: EventData] | undefined;

function failWithError(i: ModalSubmitInteraction | ChatInputCommandInteraction, message: string, data: EventData): Promise<any>
{
	lastFailedEvent = [i.user.id, data];
	return i.reply({ embeds: [{ author: Authors.Error, description: message }], ephemeral: true });
}

export default {

	registerMessageContextMenu: [
		new ContextMenuCommandBuilder()
			.setName('Create Event')
			.setType(ApplicationCommandType.Message),
		async (i) =>
		{
			let times = TimeParser.getTimes(i.targetMessage.content, i.targetMessage.createdAt);

			if (times.length == 0)
				return await i.reply({ embeds: [{ author: Authors.Error, description: 'No times found in message' }], ephemeral: true });
			

			const time = times[0];
			let eventData: EventData = {};

			if (lastFailedEvent && lastFailedEvent[0] == i.user.id)
			{
				eventData = lastFailedEvent[1];
			}
			else
			{
				const desc = i.targetMessage.content.replace(time.text, '').trim();
				if (desc.length > 0)
					eventData.description = desc;
			}

			eventData.time = time.text;

			TimeParser.dateToLosAngles(time.start.date())

			const Los_Angeles_Start = TimeParser.dateToLosAngles(time.start.date())
			const Los_Angeles_End = TimeParser.dateToLosAngles(time.end?.date())

			await i.showModal(createModal(eventData, Los_Angeles_Start, Los_Angeles_End));
		}
	],

	registerChatCommand: [
		new SlashCommandBuilder()
			.setName('create-event')
			.setDescription('Create an event')
			.addStringOption((option) =>
				option.setName('time')
					.setDescription('Time of event in PDT, used to preview the parsed time')
					.setRequired(false)
		),
		async (i) =>
		{
			let eventData: EventData = {}
			let startTime: string | undefined;
			let endTime: string | undefined;
			if (lastFailedEvent && lastFailedEvent[0] == i.user.id)
			{
				eventData = lastFailedEvent[1];
			}

			const inputTime = i.options.getString('time');

			if (inputTime)
			{
				const times = TimeParser.getTimes(inputTime);
				if (times.length == 0)
					return await failWithError(i, 'No times found in message', eventData);
				eventData.time = times[0].text;
				startTime = TimeParser.dateToLosAngles(times[0].start.date());
				endTime = TimeParser.dateToLosAngles(times[0].end?.date());
			}
			else if (eventData.time)
			{
				const times = TimeParser.getTimes(eventData.time);
				if (times.length > 0)
				{
					const time = times[0];
					startTime = TimeParser.dateToLosAngles(time.start.date());
					endTime = TimeParser.dateToLosAngles(time.end?.date());
				}
			}

			await i.showModal(createModal(eventData, startTime, endTime));
		}
	],

	registerModalSubmit: [
		modalId,
		(i) =>
		{
			const data: EventData = {
				title: i.fields.getTextInputValue('event_name'),
				description: i.fields.getTextInputValue('event_description'),
				location: i.fields.getTextInputValue('event_location'),
				time: i.fields.getTextInputValue('event_time'),
			};

			const parsedTimes = TimeParser.getTimes(i.fields.getTextInputValue('event_time'));
			
			if (!parsedTimes || parsedTimes.length == 0)
				return failWithError(i, 'Invalid time! Try entering a more specific phrase.', data);

			const parsedTime = parsedTimes[0];
			const discordTimestamp = TimeParser.chronoToDiscord(parsedTime);

			const startDate = parsedTime.start.date();
			const endDate = parsedTime.end?.date() ?? new Date(startDate.getTime() + 1000 * 60 * 60);

			return GoogleCalendar.CreateEvent({
				requestBody: {
					summary: data.title,
					description: data.description,
					location: data.location,
					start: {
						dateTime: startDate.toISOString(),
					},
					end: {
						dateTime: endDate.toISOString(),
					},
				}
			}).then(async eventData =>
			{
				const msg = await i.reply({
					embeds: [{
						author: Authors.Success,
						title: 'Event Created',
						description: `Event \`${data.title}\` created` + (data.description ? ` with description \`${data.description}\`` : '') + (data.location ? ` at \`${data.location}\`` : '') + ` at \`${parsedTime.text}\` → <t:${discordTimestamp[0].time}:${discordTimestamp[0].format}> to <t:${discordTimestamp[1].time}:${discordTimestamp[1].format}>`,
						footer: { text: '"Share Event" will expire after 5 minutes' },
					}],
					ephemeral: true,
					components: Buttons.toNiceActionRows([{
						type: ComponentType.Button,
						style: ButtonStyle.Link,
						label: 'Google Calendar',
						url: eventData?.htmlLink ?? 'https://calendar.google.com/calendar/r',
						emoji: { name: '📅' },
					}, {
						type: ComponentType.Button,
						custom_id: 'share_event',
						style: ButtonStyle.Primary,
						label: 'Share Event',
						emoji: { name: '📨' },
						}]),
					fetchReply: true,
				});

				while (true)
				{
					try
					{
						const interaction = await msg.awaitMessageComponent({ componentType: ComponentType.Button, time: 1000 * 60 * 5 });
						if (!interaction || !interaction.guild) return;

						// if the event is this week, then get the discord event
						if (startDate.getTime() < new Date().getTime() + 1000 * 60 * 60 * 24 * 7 && startDate.getTime() > new Date().getTime())
						{
							let events = await interaction.guild.scheduledEvents.fetch()
							let currentFilter: Collection<string, GuildScheduledEvent<GuildScheduledEventStatus>>;
							let thisEvent: GuildScheduledEvent<GuildScheduledEventStatus> | undefined;

							// Debug.log(data.title, startDate.getTime(), endDate.getTime());

							if (events.size > 0)
							{
								// events.forEach(event => Debug.log("BEFORE", event.name, event.scheduledStartTimestamp, event.scheduledStartTimestamp, event.name == data.title, event.scheduledStartTimestamp == startDate.getTime(), event.scheduledEndTimestamp == endDate.getTime()));

								if (events.size >= 1)
								{
									currentFilter = events.filter(e => e.name == eventData?.summary);
									events = currentFilter;
								}

								if (events.size >= 1)
								{
									currentFilter = events.filter(e => e.description == data.description);
									if (currentFilter.size > 0) events = currentFilter;
								}

								if (events.size >= 1)
								{
									currentFilter = events.filter(e => e.scheduledStartTimestamp == startDate.getTime());
									events = currentFilter;
								}

								if (events.size >= 1)
								{
									currentFilter = events.filter(e => e.scheduledEndTimestamp == endDate.getTime());
									events = currentFilter;
								}

								if (events.size == 1)
								{
									thisEvent = events.first();
								}
							}
	
							if (!thisEvent)
							{
								await interaction.reply({
									embeds: [{
										author: Authors.Error,
										description: 'Discord Event is still being created, try again in a few seconds',
									}],
									ephemeral: true,
								});
								continue;
							}
							
							return await interaction.reply({
								content: thisEvent ? thisEvent.url : 'https://discord.com/channels/' + interaction.guild.id,
								components: Buttons.toNiceActionRows([{
									type: ComponentType.Button,
									style: ButtonStyle.Link,
									label: 'Google Calendar',
									url: eventData?.htmlLink ?? 'https://calendar.google.com/calendar/r',
									emoji: { name: '📅' },
								}]),
							});
						}

						return await interaction.reply({
							embeds: [{
								author: Authors.Calendar,
								title: data.title,
								description: `From <t:${discordTimestamp[0].time}:${discordTimestamp[0].format}> to <t:${discordTimestamp[1].time}:${discordTimestamp[1].format}>` + 
									(data.location ? "\nLocation: \`" + data.location : "\`") + "\n" +
									(data.description ? data.description : ""),
								footer: { text: "New Event Created" },
							}],
							components: Buttons.toNiceActionRows([{
								type: ComponentType.Button,
								style: ButtonStyle.Link,
								label: 'Google Calendar',
								url: eventData?.htmlLink ?? 'https://calendar.google.com/calendar/r',
								emoji: { name: '📅' },
							}])
						});
					}
					catch (e)
					{
						Debug.error(e);
						return;
					}
				}
			}).catch((err) =>
			{
				Debug.error(err);
				return failWithError(i, 'Failed to create event! Information looked good but internal error prevented event being created.', data)
			});
		}
	]

} as BotModule;