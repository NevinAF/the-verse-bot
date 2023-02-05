export namespace BigVoiceChannels
{
	const channelIds: Set<string> = new Set();

	export function Add(channelId: string)
	{
		channelIds.add(channelId);
	}

	export function Remove(channelId: string)
	{
		return channelIds.delete(channelId);
	}

	export function IsBig(channelId: string)
	{
		return channelIds.has(channelId);
	}
}