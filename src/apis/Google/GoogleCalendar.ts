import { calendar_v3 } from "googleapis";
import { GoogleClient } from "./GoogleClient";

export namespace GoogleCalendar
{
	export async function GetEvents(params: calendar_v3.Params$Resource$Events$List):
		Promise<calendar_v3.Schema$Event[] | null>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;
		if (!params.calendarId)
			params.calendarId = process.env.GOOGLE_CALENDAR_ID;
		
		const events = await GoogleClient.CalendarClient.events.list(params);
		return events?.data?.items ?? null;
	}

	export async function CreateEvent(params: calendar_v3.Params$Resource$Events$Insert):
		Promise<calendar_v3.Schema$Event | null>
	{
		if (!params.auth)
			params.auth = GoogleClient.auth;
		if (!params.calendarId)
			params.calendarId = process.env.GOOGLE_CALENDAR_ID;
		
		const event = await GoogleClient.CalendarClient.events.insert(params);
		return event?.data ?? null;
	}
}