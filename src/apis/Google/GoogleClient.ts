import Debug from "@/debug";
import { GoogleAuth } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { sheets_v4, google, calendar_v3, drive_v3 } from "googleapis";

export namespace GoogleClient
{
	export var SheetsClient: sheets_v4.Sheets;
	export var CalendarClient: calendar_v3.Calendar;
	export var DriveClient: drive_v3.Drive;
	export var auth: GoogleAuth<JSONClient>;

	export async function initialize()
	{
		Debug.log("Initializing Google API client...");

		GoogleClient.auth = new google.auth.GoogleAuth({
			keyFile: process.env.GOOGLE_KEY_FILE,
			//url to spreadsheets API
			scopes: ["https://www.googleapis.com/auth/spreadsheets",
				"https://www.googleapis.com/auth/calendar",
				"https://www.googleapis.com/auth/drive"],
		});

		const authClientObject = await auth.getClient();

		SheetsClient = google.sheets({ version: "v4", auth: authClientObject });
		CalendarClient = google.calendar({ version: 'v3', auth: authClientObject });
		DriveClient = google.drive({ version: 'v3', auth: authClientObject });
	}
}