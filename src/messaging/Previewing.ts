import { APIEmbed, Message } from "discord.js";

namespace Previewing
{
	const maxMessageLength = 75;

	export function previewMessage(msg: Message): string
	{
		let trim = msg.content.trim().replace(/\s+/g, " ");
		if (trim.length > maxMessageLength) trim = trim.substring(0, maxMessageLength - 3) + "...";

		return `from ${msg.author.tag} (${msg.content.length}c): ${trim}`
	}

	export function EmbeddedPreviewMessage(msg: Message<boolean>): APIEmbed[]
	{
		const avatarURL = msg.author.avatarURL();
		var options: APIEmbed[] = [{
			color: 0xA020F0, 
			title: "Preview of Message:",
			description: "Sent by: " + msg.author.username + " on <t:" + msg.createdTimestamp + ">",
			thumbnail: avatarURL ? { url: avatarURL } : undefined,
		}];

		if (msg.author.bot)
			if (msg.embeds && msg.embeds.length > 0)
				// @ts-ignore
				msg.embeds.forEach(e => options.push(e));

		if (msg.content)
		{
			let short; 
			if (msg.content.length > 300) short = msg.content.substring(0, 298) + "...";
			else short = msg.content;

			options[0].description += "\n>>> " + msg.content;
		}

		return options;
	}

	export function msToHuman(milli_secs: number, units?: { ms?: boolean, sec?: boolean, min?: boolean, hr?: boolean }): string
	{
		if (milli_secs <= 0) return "0sec";

		const use_ms = units?.ms ?? false;
		const use_sec = units?.sec ?? true;
		const use_min = units?.min ?? true;
		const use_hr = units?.hr ?? true;

		var ms = milli_secs % 1000;
		milli_secs = (milli_secs - ms) / 1000;
		var secs = milli_secs % 60;
		milli_secs = (milli_secs - secs) / 60;
		var mins = milli_secs % 60;
		milli_secs = (milli_secs - mins) / 60;
		var hrs = milli_secs % 24;
		var days = (milli_secs - hrs) / 24;
	
		let result = "";
		if (days > 0) result += days + "d ";
		if (hrs > 0 && use_hr) result += hrs + "hr ";
		if (mins > 0 && use_min) result += mins + "min "
		if (secs > 0 && use_sec) result += secs + "sec ";
		if (use_ms) result += ms + "ms ";
		return result.substring(0, result.length - 1);
	}

	export function getHumanTime(str: string): number
	{
		str = str.toLowerCase()
			.replace(/[ .;,]/g, "")
			.replace(/and/g, "")
			.replace(/hours?/g, "h")
			.replace(/hrs?/g, "h")
			.replace(/minutes?/g, "m")
			.replace(/mins?/g, "m")
			.replace(/seconds?/g, "s")
			.replace(/secs?/g, "s")
			.replace(/milliseconds?/g, "ms")
			.replace(/millis?/g, "ms");
		
		let result = 0;

		let matches = str.match(/(\d+)h/g);
		if (matches) matches.forEach(m => result += parseInt(m) * 3600000);
		matches = str.match(/(\d+)m/g);
		if (matches) matches.forEach(m => result += parseInt(m) * 60000);
		matches = str.match(/(\d+)s/g);
		if (matches) matches.forEach(m => result += parseInt(m) * 1000);
		matches = str.match(/(\d+)ms/g);
		if (matches) matches.forEach(m => result += parseInt(m));
		
		return result;
	}
}

export default Previewing;