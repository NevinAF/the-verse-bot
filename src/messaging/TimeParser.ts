import { CacheType, CommandInteraction, Message }from "discord.js";
import Debug from "@/debug";
import * as chrono from "chrono-node";

const TIMEZONE_ABBR_MAP = {
	ACDT: 630,
	ACST: 570,
	ADT: -180,
	AEDT: 660,
	AEST: 600,
	AFT: 270,
	AKDT: -480,
	AKST: -540,
	ALMT: 360,
	AMST: -180,
	AMT: -240,
	ANAST: 720,
	ANAT: 720,
	AQTT: 300,
	ART: -180,
	AST: -240,
	AWDT: 540,
	AWST: 480,
	AZOST: 0,
	AZOT: -60,
	AZST: 300,
	AZT: 240,
	BNT: 480,
	BOT: -240,
	BRST: -120,
	BRT: -180,
	BST: 60,
	BTT: 360,
	CAST: 480,
	CAT: 120,
	CCT: 390,
	CDT: -300,
	CEST: 120,
	CET: 60,
	CHADT: 825,
	CHAST: 765,
	CKT: -600,
	CLST: -180,
	CLT: -240,
	COT: -300,
	CST: -360,
	CVT: -60,
	CXT: 420,
	ChST: 600,
	DAVT: 420,
	EASST: -300,
	EAST: -360,
	EAT: 180,
	ECT: -300,
	EDT: -240,
	EEST: 180,
	EET: 120,
	EGST: 0,
	EGT: -60,
	EST: -300,
	ET: -300,
	FJST: 780,
	FJT: 720,
	FKST: -180,
	FKT: -240,
	FNT: -120,
	GALT: -360,
	GAMT: -540,
	GET: 240,
	GFT: -180,
	GILT: 720,
	GMT: 0,
	GST: 240,
	GYT: -240,
	HAA: -180,
	HAC: -300,
	HADT: -540,
	HAE: -240,
	HAP: -420,
	HAR: -360,
	HAST: -600,
	HAT: -90,
	HAY: -480,
	HKT: 480,
	HLV: -210,
	HNA: -240,
	HNC: -360,
	HNE: -300,
	HNP: -480,
	HNR: -420,
	HNT: -150,
	HNY: -540,
	HOVT: 420,
	ICT: 420,
	IDT: 180,
	IOT: 360,
	IRDT: 270,
	IRKST: 540,
	IRKT: 540,
	IRST: 210,
	IST: 330,
	JST: 540,
	KGT: 360,
	KRAST: 480,
	KRAT: 480,
	KST: 540,
	KUYT: 240,
	LHDT: 660,
	LHST: 630,
	LINT: 840,
	MAGST: 720,
	MAGT: 720,
	MART: -510,
	MAWT: 300,
	MDT: -360,
	MESZ: 120,
	MEZ: 60,
	MHT: 720,
	MMT: 390,
	MSD: 240,
	MSK: 180,
	MST: -420,
	MUT: 240,
	MVT: 300,
	MYT: 480,
	NCT: 660,
	NDT: -90,
	NFT: 690,
	NOVST: 420,
	NOVT: 360,
	NPT: 345,
	NST: -150,
	NUT: -660,
	NZDT: 780,
	NZST: 720,
	OMSST: 420,
	OMST: 420,
	PDT: -420,
	PET: -300,
	PETST: 720,
	PETT: 720,
	PGT: 600,
	PHOT: 780,
	PHT: 480,
	PKT: 300,
	PMDT: -120,
	PMST: -180,
	PONT: 660,
	PST: -480,
	PT: -480,
	PWT: 540,
	PYST: -180,
	PYT: -240,
	RET: 240,
	SAMT: 240,
	SAST: 120,
	SBT: 660,
	SCT: 240,
	SGT: 480,
	SRT: -180,
	SST: -660,
	TAHT: -600,
	TFT: 300,
	TJT: 300,
	TKT: 780,
	TLT: 540,
	TMT: 300,
	TVT: 720,
	ULAT: 480,
	UTC: 0,
	UYST: -120,
	UYT: -180,
	UZT: 300,
	VET: -210,
	VLAST: 660,
	VLAT: 660,
	VUT: 660,
	WAST: 120,
	WAT: 60,
	WEST: 60,
	WESZ: 60,
	WET: 0,
	WEZ: 0,
	WFT: 720,
	WGST: -120,
	WGT: -180,
	WIB: 420,
	WIT: 540,
	WITA: 480,
	WST: 780,
	WT: 0,
	YAKST: 600,
	YAKT: 600,
	YAPT: 600,
	YEKST: 360,
	YEKT: 360,
};

function toTimezoneOffset(timezoneInput?: string | number): number | null {
	if (timezoneInput === null || timezoneInput === undefined) {
		return null;
	}

	if (typeof timezoneInput === "number") {
		return timezoneInput;
	}

	return TIMEZONE_ABBR_MAP[timezoneInput] ?? null;
}


namespace TimeParser
{
	// /**
	//  * This is a wrapper of the
	//  * "any-date-parser" function "attempt" that instead creates a full date based on any description and
	//  * also returns the formate that describes the best granularity for the input.
	//  * 
	//  * @param str A string that constist of only a description of a date.
	//  * @returns An object (pair) that containts the UNIX timestamp and Discord format described by input string.
	//  */
	// function attemptTime(input: string | null): { time: number; format: string; } | null
	// {
	// 	var str: string = input ?? "";
	// 	if (str == "") return null;

	// 	const weekdays = [
	// 		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	// 	];

	// 	let dayadder = -1;
	// 	let houraddr = 1;
	// 	weekdays.forEach(function (d, i)
	// 	{
	// 		//Debug.Log(`${str} vs ${d}`, str.startsWith(d + " "), str.endsWith(" " + d));
	// 		if (str.startsWith(d + " "))
	// 		{
	// 			str = str.substring(d.length + 1, str.length);
	// 			dayadder = i;

	// 			if (str.startsWith("at ") || str.startsWith("in ") || str.startsWith("on "))
	// 				str = str.substring(3, str.length);

	// 			return;
	// 		}
	// 		else if (str.endsWith(" " + d))
	// 		{
	// 			str = str.substring(0, str.length - d.length - 1);
	// 			dayadder = i;

	// 			if (str.endsWith(" at") || str.endsWith(" on") || str.endsWith(" in"))
	// 				str = str.substring(0, str.length - 3);

	// 			return;
	// 		}
	// 	});

	// 	const atmp = adp.attempt(str);
	// 	Debug.log("Attempting string: '" + str + "'...:" + JSON.stringify(atmp));

	// 	if (!atmp || atmp.invalid) return null;

	// 	const current = new Date();
	// 	if (dayadder != -1)
	// 	{
	// 		dayadder = dayadder - current.getDay();
	// 		if (dayadder <= 0) dayadder += 7;
	// 	}

	// 	const datetarget = [
	// 		(atmp.year) ? atmp.year : current.getFullYear(),
	// 		(atmp.month) ? atmp.month - 1 : current.getMonth(),
	// 		(atmp.day) ? atmp.day : (current.getDate() + dayadder),
	// 		((atmp.hour) ? atmp.hour : current.getHours()) + houraddr,
	// 		(atmp.minute) ? atmp.minute : 0, //current.getMinutes(),
	// 		(atmp.second) ? atmp.second : 0 //current.getSeconds()
	// 	];

	// 	if (!atmp.year && atmp.month && (atmp.month < current.getMonth())) datetarget[0]++;
	// 	if (!atmp.month && atmp.day && (atmp.day < current.getDate())) datetarget[1]++;
	// 	if (!atmp.day && dayadder == -1 && atmp.hour && (atmp.hour < current.getHours())) datetarget[2]++;
	// 	if (!atmp.hour && atmp.minute && (atmp.minute < current.getMinutes())) datetarget[3]++;
	// 	if (!atmp.minute && atmp.second && (atmp.second < current.getSeconds())) datetarget[4]++;

	// 	//Debug.Log(atmp.hour, current.getHours());

	// 	const target = new Date(
	// 		datetarget[0],
	// 		datetarget[1],
	// 		datetarget[2],
	// 		datetarget[3],
	// 		datetarget[4],
	// 		datetarget[5],
	// 	);

	// 	Debug.log(current, target);

	// 	let format = "f";

	// 	if ((!atmp.year) && (!atmp.month) && (!atmp.day) && (dayadder == -1)
	// 		&& (!atmp.second))
	// 		format = "t";
	// 	else if ((!atmp.year) && (!atmp.month) && (!atmp.day) && (dayadder == -1)
	// 		&& (atmp.second))
	// 		format = "T";
	// 	// else if ((atmp.year) && (atmp.month) && (atmp.day)
	// 	// 	&& (atmp.hour) && (atmp.minute) && (atmp.second))
	// 	// 	format = "d";
	// 	else if ((!atmp.hour) && (!atmp.minute) && (!atmp.second))
	// 		format = "D";
	// 	// else if ((atmp.year) && (atmp.month) && (atmp.day)
	// 	// 	&& (atmp.hour) && (atmp.minute) && (atmp.second))
	// 	// 	format = "F";
	// 	// else if ((atmp.year) && (atmp.month) && (atmp.day)
	// 	// 	&& (atmp.hour) && (atmp.minute) && (atmp.second))
	// 	// 	format = "R";

	// 	return { "time": Math.round(target.getTime() / 1000), "format": format };
	// }

	/**
	 * Converts any and all date/time references contained in the input string into a UNIX timestamp
	 * and a discord format.
	 * 
	 * @param str English sentences, which may contain date/time references
	 * @returns An array of objects that state what english input (in) was used to create a corresponding
	 * timestamp and format (out)
	 */
	export function getTimes(input: string | null, messageTime?: Date, timezone: string | number = "PST"): chrono.ParsedResult[]
	{
		var str: string = input ?? "";
		if (str == "") return [];

		let times: chrono.ParsedResult[] = [];

		let discordTimestamps = str.match(/<t:(\d+):[a-z]>/g);
		if (discordTimestamps)
		{
			discordTimestamps.forEach(function (t)
			{
				let time = parseInt(t.substring(3, t.length - 2));
				let format = t.substring(t.length - 1, t.length);
				let startDate: Date = new Date(time * 1000);

				times.push({
					refDate: new Date(),
					text: t,
					index: str.indexOf(t),
					start: {
						isCertain(str) { return true; },
						get(str) { return -1; },
						date() { return startDate; },
					},
					date() { return startDate; },
				})
			});
			str.replace(/<t:\d+:[a-z]>/g, "");
		}

		if (!messageTime)
		{
			messageTime = new Date();
		}

		Debug.log("Parsing string: '" + str + "' with timezone: " + timezone);
		const parsed = chrono.parse(str, { instant: messageTime, timezone: timezone }, { forwardDate: true });
		if (parsed)
		{
			parsed.forEach(function (t)
			{
				times.push(t);
				Debug.log("Found time: " + t.text + " at index: " + t.index + " with date: " + t.date());
			});
		}


		// let splt = str.split(" ");
		// let count = 0;
	
		// // The max length of a time is 6 words
		// for (let j = 0; j < splt.length; j++)
		// {
		// 	for (let i = 6; i > 0; i--)
		// 	{
		// 		if (j + i > splt.length) continue;
		// 		count++;

		// 		//Debug.Log(`\nRunning [${j}-${j+i})`)
		// 		let comp = "";
		// 		for (let x = j; x < j + i; x++) comp += splt[x] + " ";
		// 		comp = comp.trim();
		// 		if (comp.endsWith(".") || comp.endsWith(",") || comp.endsWith("!") || comp.endsWith("?"))
		// 			comp = comp.substring(0, comp.length - 1);

		// 		let time = attemptTime(comp);

		// 		if (time)
		// 		{
		// 			times.push({ in: `${comp}`, out: time });
		// 			//Debug.Log({ "in": comp, "out": time});

		// 			j += i;
		// 			i = 6;
		// 		}
		// 	}
		// }

		// for (const format of adp.formats) {
		// 	// if (
		// 	// 	Array.isArray(format.locales) &&
		// 	// 	format.locales.length > 0 &&
		// 	// 	!format.locales.includes(new Intl.Locale(locale).baseName)
		// 	// ) {
		// 	// 	// some formats only make sense for certain locales, e.g. month/day/year
		// 	// 	continue;
		// 	// }

		// 	const dt = format.getMatches(str);
		// 	const atmp = format.attempt(str);

		// 	Debug.Log("Attempt: ", atmp, "Format: ", dt)
		// }

		Debug.log(`-> found ${times.length} reference(s) to a time/date`);

		return times;
	}

	export function chronoToDiscord(parsedResult: chrono.ParsedResult): [{ time: number, format: string }, { time: number, format: string }]
	{
		let time = parsedResult.start.date().getTime();
		let current = new Date().getTime();
		let format: string = "";
		
		// If the time is further in the future than 6 months, use a date format
		if (time - current > 15778476000)
		{
			format = "D";
		}
		// If the time is further in the future than 6 hours, use short date/time format
		else if (time - current > 21600000)
		{
			format = "f";
		}
		else if (time - current > 0)
		{
			format = "R";
		}
		else
		{
			format = "f";
		}

		return [{
			time: Math.round(time / 1000),
			format: format
		}, {
			time: (parsedResult.end ? Math.round(parsedResult.end.date().getTime() / 1000) : Math.round((time + 3600000) / 1000)),
			format: format
		}];
	}
	
	const LosAngeles_options_long: Intl.DateTimeFormatOptions = {
		month: "short",
		timeZone: "America/Los_Angeles",
		hour12: true,
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	};

	const LosAngeles_options_short: Intl.DateTimeFormatOptions = {
		timeZone: "America/Los_Angeles",
		hour12: true,
		hour: "2-digit",
		minute: "2-digit",
	};

	export function dateToLosAngles(date?: Date, short: boolean = false): string
	{
		return date ? date.toLocaleString("en-US", short ? LosAngeles_options_short : LosAngeles_options_long) : undefined;
	}

	export function isValidTimezone(timezone: string): boolean
	{
		return toTimezoneOffset(timezone) ? true : false;
	}

	/**
	 * Based callback function that can be used to react to user messages for optional timestamps.
	 * 
	 * @param client Current discord client
	 * @param msg Message that was created
	 * @returns void
	 */
	async function OnMessage(msg: Message<boolean>): Promise<void>
	{
		// const times = getTimes(msg.content);

		// let content = "";

		// times.forEach(e =>
		// {
		// 	content += `"${e.in}" → <t:${e.out.time}:${e.out.format}>\n`
		// });

		// if (content == "") return;

		// MessageReactionCallback(msg, "<:timezone_react:981448185128030208>", _ =>
		// {
		// 	Debug.Log(`-> Reaction Recieved on message ${msg.id}`);
		// 	RemoveReactionFromMsg(msg, "<:timezone_react:981448185128030208>");
		// 	msg.reply({
		// 		embeds: [{
		// 			description: content, author: {
		// 				name: "Time Converter", iconURL: "https://i.ibb.co/Nnsf207/Control-V-modified.png"
		// 			}
		// 		}]
		// 	});
		// });
	}

	async function OnCMD_Timecommand(interaction: CommandInteraction<CacheType>)
	{
		// const times = getTimes(interaction.options.getString("input"));
		// let content = "";

		// times.forEach(e =>
		// {
		// 	content += e.in + " → \`<t:" + e.out.time + ":" + e.out.format + ">\`\n";
		// });

		// if (content == "") content = "No times were found.";
		// await interaction.reply({
		// 	embeds: [{
		// 		description: content, author: {
		// 			name: "Time Converter", iconURL: "https://i.ibb.co/Nnsf207/Control-V-modified.png"
		// 		}
		// 	}], ephemeral: true
		// });
	}


	// export class TimeConverterMod extends DiscordModule
	// {
	// 	Initialize()
	// 	{
	// 		ClientHelper.on("messageCreate", OnMessage,
	// 			msg => !msg.author.bot && msg.channel.type != "DM"
	// 		);

	// 		ClientHelper.reg_cmd(
	// 			new SlashCommandBuilder()
	// 				.setName('timecommand')
	// 				.setDescription('Converts any times in given text into Discord timezone commands!')
	// 				.addStringOption(option =>
	// 					option.setName('input')
	// 						.setDescription('The input to be parsed for times')
	// 						.setRequired(true)),
	// 			OnCMD_Timecommand
	// 		)
	// 	}
	// }
}

export default TimeParser;