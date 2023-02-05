import ClientWrapper from "@/ClientWrapper";
import { BotModule } from "@/types";
import { PresenceStatus } from "discord.js";
import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";
import { InternalMemberRole } from "@/database/RolesModuleSheet";

// BUG this only works if the user is only in one guild with the bot?

function incPresence(duration: number, status: PresenceStatus, guildId: string, userId: string)
{
	let col: UserEntryData = -1;
	switch (status)
	{
		case "online":
			col = UserEntryData.OnlineTime;
			break;
		case "idle":
			col = UserEntryData.IdleTime;
			break;
		case "dnd":
			col = UserEntryData.DNDTime;
			break;
		case "offline":
			col = UserEntryData.OfflineTime;
	}

	return UserData.incrementCell(guildId, { compareValue: userId, column: UserEntryData.UserID }, col, duration);
}

/**
 * Updates the stats for the users presence.
 */
export default {

	registerPresenceUpdate: [async (oldPresence, newPresence) =>
	{
		if (oldPresence.presence === newPresence.presence || !oldPresence.presence?.status)
			return;
		
		const duration = newPresence.timestamp - oldPresence.timestamp;

		return incPresence(duration, oldPresence.presence.status, oldPresence.presence.guild.id, oldPresence.presence.member.id);
	}],

	onExiting: [async () =>
	{
		const crashTime = Date.now();
		const readyTime = ClientWrapper.Client.readyTimestamp;

		for await (const guild of ClientWrapper.Client.guilds.cache.values())
		{
			const members = await guild.members.fetch({ force: true });

			for await (const member of members.values())
			{
				const presenceState = member.presence?.status ?? "offline";
				const lastTime = ClientWrapper.Instance.getExtraGuildData(guild.id).getAndUpdatePresenceStamp(member.id, crashTime, readyTime);
				const duration = crashTime - lastTime;
				const internalRole = await InternalMemberRole.fetch(member.guild.id);

				await Promise.all([
					incPresence(duration, presenceState, member.guild.id, member.id),
					UserData.writeCellData(member.guild.id, { compareValue: member.id, column: UserEntryData.UserID }, UserEntryData.Handle, member.displayName ?? member.user.username),
					UserData.writeCellData(
						member.guild.id,
						{ compareValue: member.id, column: UserEntryData.UserID },
						UserEntryData.CurrentMember,
						member.roles.cache.has(internalRole) ? "Yes" : "No"
					),
				]);
			}

			for await (const userId of await UserData.getColumnStringData(guild.id, UserEntryData.UserID))
			{
				if (!members.some(m => m.id === userId))
				{
					await UserData.writeCellData(guild.id, { compareValue: userId, column: UserEntryData.UserID }, UserEntryData.CurrentMember, "No");
				}
			}
		}
	}]

} as BotModule;