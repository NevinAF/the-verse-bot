import ClientWrapper from "@/ClientWrapper";
import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";
import { Guild } from "discord.js";
import { Title } from "./common";
import titles from "./titles";
import fs from "fs";

export default class TitlePopulator
{

	public static async populate(guild: Guild)
	{
		await ClientWrapper.Instance.backup();

		const userIds = await UserData.getColumnStringData(guild.id, UserEntryData.UserID);
		const currentMembers = await UserData.getColumnBooleanData(guild.id, UserEntryData.CurrentMember);

		const activeUsers = userIds
			.map(function (userId, index): [string, number] { return [userId, index] })
			.filter((_, index) => currentMembers[index]);

		Title.populateData = {
			activeUsers: activeUsers,
			guild: guild,
			periodDuration: 7 * 24 * 60 * 60 * 1000,
		}

		for await (const title of titles)
		{
			await title.beginPopulation(Title.populateData);
		}

		// const messages = await guild.messages.fetch({ limit: 100 });
		// for await (const message of messages)
		// {
		// 	for await (const title of titles)
		// 	{
		// 		await title.forMessage(message, Title.populateData);
		// 	}
		// }

		for await (const channel of guild.channels.cache.values())
		{
			for await (const title of titles)
			{
				await title.forChannel(channel, Title.populateData);
			}
		}

		for await (const title of titles)
		{
			await title.endPopulation(Title.populateData);
		}

		// Write the titles to a file
		const fileStream = fs.createWriteStream("titles.txt");
		for await (const title of titles)
		{
			fileStream.write(title.constructor.name + "\n");
			fileStream.write("Forward:\n");
			for await (const forwardTitle of title.getTopForwardTitles(15, Title.populateData))
			{
				fileStream.write("\t" + forwardTitle + "\n");
			}

			if (title.reverseTitle)
			{
				fileStream.write("Reverse:\n");
				for await (const reverseTitle of title.getTopReverseTitles(15, Title.populateData)!)
				{
					fileStream.write("\t" + reverseTitle + "\n");
				}
			}

			fileStream.write("\n");
		}

		fileStream.end();

		
	}
}