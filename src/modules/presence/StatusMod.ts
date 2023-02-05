import ClientWrapper from "@/ClientWrapper";
import Debug from "@/debug";
import { Usage } from "@/stats";
import { BotModule } from "@/types";
import { ActivitiesOptions, ActivityType, PresenceData } from "discord.js";

class StatusMod
{
	static readonly updateInterval = 1000 * 60 * 10; // 10 minutes
	static readonly idleInterval = 1000 * 60 * 10; // 10 minutes

	static readonly options: ActivitiesOptions[] = [
		{
			name: "Moderator",
			type: ActivityType.Playing,
		},
		{
			name: "The Verse",
			type: ActivityType.Watching
		},
		{
			name: "Prosocial Development",
			type: ActivityType.Listening
		},
		{
			name: "Invisible Helper",
			type: ActivityType.Streaming
		},
		{
			name: "Best Bot Ever",
			type: ActivityType.Competing
		},
		{
			name: "Data Management",
			type: ActivityType.Playing
		},
		{
			name: "Creators Create",
			type: ActivityType.Watching
		},
		{
			name: "Innovative Discussions",
			type: ActivityType.Listening
		},
		{
			name: "Self-reflection",
			type: ActivityType.Playing
		}
	]

	static idleMessage: ActivitiesOptions = {
		name: "Silence",
		type: ActivityType.Listening,
	};

	private currentStatus: number = -1;
	private isIdle = false;

	GetNewStatus(): PresenceData
	{
		if (this.isIdle)
		{
			return {
				activities: [
					StatusMod.idleMessage
				],
				status: "idle",
				afk: false
			};
		}

		let max = (this.currentStatus == -1) ? StatusMod.options.length : (StatusMod.options.length - 1)
		var randVal = Math.floor(Math.random() * max);
		if (randVal >= this.currentStatus)
			if (randVal == StatusMod.options.length - 1)
				randVal = 0;
			else
				randVal++;

		this.currentStatus = randVal;
		return {
			activities: [
				StatusMod.options[randVal]
			],
			status: "online",
			afk: false
		};
	}

	private updateTimer: NodeJS.Timeout | null = null;
	private idleTimer: NodeJS.Timeout | null = null;

	UpdateStatus()
	{
		const status = this.GetNewStatus();
		ClientWrapper.Client.user?.setPresence(status);

		Debug.event("StatUpd", `${status.status}: ${ActivityType[status.activities?.[0].type ?? ActivityType.Custom]} - ${status.activities?.[0].name}`);

		if (!this.isIdle)
		{
			if (this.updateTimer) clearTimeout(this.updateTimer);
			this.updateTimer = setTimeout(this.UpdateStatus, StatusMod.updateInterval);
		}
	}

	SetIdle()
	{
		this.isIdle = true;

		if (this.updateTimer) clearTimeout(this.updateTimer);
		this.updateTimer = null;

		this.UpdateStatus();
	}

	OnUsed()
	{
		this.isIdle = false;

		if (this.idleTimer != null)
		{
			clearTimeout(this.idleTimer);
			this.idleTimer = null;
		}

		this.idleTimer = setTimeout(this.SetIdle, StatusMod.idleInterval);

		if (this.updateTimer == null)
			this.UpdateStatus();
	}
}

export default {

	onReady: [() =>
	{
		const statusMod = new StatusMod();

		statusMod.UpdateStatus = statusMod.UpdateStatus.bind(statusMod);
		statusMod.SetIdle = statusMod.SetIdle.bind(statusMod);
		statusMod.OnUsed = statusMod.OnUsed.bind(statusMod);
		statusMod.GetNewStatus = statusMod.GetNewStatus.bind(statusMod);

		statusMod.UpdateStatus();
		Usage.onUsed(_ => statusMod.OnUsed());
	}]

} as BotModule;