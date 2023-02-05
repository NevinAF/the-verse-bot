import { BotModule } from "@/types";
import { AutoRecordRole } from "@/database/RolesModuleSheet";
import RecordingSession from "./RecordingSession";

/**
 * Callbacks for voice channel state changes, filtering to channels that only have recording sessions.
 */
export default {

	registerVoiceStateUpdate: [(oldState, newState) =>
	{
		if (oldState.state.channelId === newState.state.channelId || (oldState.state.member ?? newState.state.member).user.bot)
			return;

		const left = RecordingSession.Sessions.get(oldState.state.channelId)?.leaveUser(oldState.state.member.user.id, true);
		let joined: Promise<any>;

		if (newState.state.channelId !== null && RecordingSession.Sessions.has(newState.state.channelId))
		{
			joined = Promise.all([
				newState.state.guild.members.fetch(newState.state.member.user.id),
				AutoRecordRole.fetch(newState.state.guild.id)
			])
			.then(([member, role]) =>
			{
				return RecordingSession.Sessions.get(newState.state.channelId)?.joinUser(newState.state.member.user.id, !member.roles.cache.has(role));
			});
		}

		return Promise.all([left, joined]);
	}]

} as BotModule;