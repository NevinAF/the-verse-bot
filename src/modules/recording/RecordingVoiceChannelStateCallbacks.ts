import { BotModule } from "@/types";
import { AutoRecordRole } from "@/database/RolesModuleSheet";
import RecordingSession from "./RecordingSession";

/**
 * Callbacks for voice channel state changes, filtering to channels that only have recording sessions.
 */
export default {

	registerVoiceStateUpdate: [(oldState, newState) =>
	{
		if (oldState.channelId === newState.channelId || (oldState.member ?? newState.member)?.user.bot)
			return;

		const left = (oldState.channelId && oldState.member?.user.id) &&
			RecordingSession.Sessions.get(oldState.channelId)?.leaveUser(oldState.member.user.id, true);
		let joined: Promise<any> | undefined = undefined;

		if (newState.channelId && newState.member?.user.id && RecordingSession.Sessions.has(newState.channelId))
		{
			const newStateUserId = newState.member.user.id;
			const newStateChannelId = newState.channelId;
			joined = Promise.all([
				newState.guild.members.fetch(newState.member.user.id),
				AutoRecordRole.fetch(newState.guild.id)
			])
			.then(([member, role]) =>
			{
				return RecordingSession.Sessions.get(newStateChannelId)?.joinUser(newStateUserId, !member.roles.cache.has(role));
			});
		}

		return Promise.all([left, joined]);
	}]

} as BotModule;