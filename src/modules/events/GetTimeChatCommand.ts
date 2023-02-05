import { BotModule } from "@/types";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Authors, TimeParser } from "@/messaging";

async function getTime(i: ChatInputCommandInteraction)
{
	let timezone: string | number | undefined = i.options.getString("timezone");

	if (timezone && !TimeParser.isValidTimezone(timezone))
	{
		const UTC_string = timezone.match(/UTC([+-]\d+)(:\d+)?/);
		if (UTC_string)
		{
			let UTC = parseInt(UTC_string[1]) * 60;
			if (UTC_string[2])
			{
				const minutes = parseInt(UTC_string[2].substring(1));
				if (UTC_string[1].startsWith("-"))
					UTC -= minutes;
				else UTC += minutes;
			}

			if (UTC >= -840 && UTC <= 840)
				timezone = UTC;
			else timezone = undefined;
		}
		else timezone = undefined;
	}
	else timezone = "PST";

	if (!timezone)
		return await i.reply({
			embeds: [{
				author: Authors.Error,
				title: 'Timezone is not valid!',
				description: "The timezones must be in standard abbreviation format (e.g. PST, EST, CWST) or UTC offset format (e.g. UTC+4, UTC-5:30). If the timezone you are looking for is still throwing this error, please consider using the UTC time or you can look through [all implemented timezones here](https://github.com/wanasit/chrono/blob/master/src/timezone.ts)."
			}], ephemeral: true
		});

	const time = TimeParser.getTimes(i.options.getString('phrase', true), i.createdAt, timezone);

	if (time.length === 0)
		return await i.reply({ embeds: [{ author: Authors.Error, description: 'No times found in phrase' }], ephemeral: true });
	
	const discordTimestamps = time.map(TimeParser.chronoToDiscord);

	return await i.reply({
		embeds: [{
			author: Authors.Success,
			description: discordTimestamps.map((e, i) => time[i].text + " → <t:" + e[0].time + ":" + e[0].format + "> == \`<t:" + e[0].time + ":" + e[0].format + ">\`").join("\n"),
			footer: {
				text: "Default Timezone: " + timezone + ", Copy the <t:_> to paste and share in discord"
			}
		}], ephemeral: true
	});
}

/**
 * Command for creating a timestamp for a given time. Useful for scheduling events and correlating times.
 */
export default {
	registerChatCommand: [
		new SlashCommandBuilder()
			.setName('get-time')
			.setDescription('Gets the time from a phrase')
			.addStringOption((option) =>
				option
					.setName('phrase')
					.setDescription('The phrase to parse')
					.setRequired(true)
			)
				.addStringOption((option) =>
					option
						.setName('timezone')
						.setDescription('The timezone to use')
						.setRequired(false)
			),

		getTime
	]
} as BotModule;