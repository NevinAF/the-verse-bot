import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";
import { Previewing } from "@/messaging";
import { Channel, Guild, Message } from "discord.js";

export interface PopulateData
{
	activeUsers: readonly (readonly [userId: string, dataIndex: number])[],
	guild: Guild,
	periodDuration: number,
}

export abstract class Title
{
	public static populateData: PopulateData | null;

	public static formatTitle(who: string | number, title: string, description: string): string
	{
		if (typeof who === "number" && Title.populateData)
		{
			const userId = Title.populateData.activeUsers[who][0];
			who = `<@${userId}>`;
		}

		return `${who}: **${title}**, ${description}`;
	}

	public static formatDuration(duration: number, minutes: boolean = false): string
	{
		let time = Previewing.msToHuman(duration, {sec: false, min: minutes });

		if (Title.populateData)
			time += ", " + (duration / Title.populateData.periodDuration).toFixed(2) + "%";

		return time;
	}

	public readonly forwardTitle: string;
	public readonly reverseTitle: string | null;

	public constructor(param: { forwardTitle: string, reverseTitle?: string })
	{
		this.forwardTitle = param.forwardTitle;
		this.reverseTitle = param.reverseTitle ?? null;
	}

	public async beginPopulation(data: PopulateData): Promise<void> { }
	public async endPopulation(data: PopulateData): Promise<void> { }
	public async forMessage(message: Message, data: PopulateData): Promise<void> { }
	public async forChannel(channel: Channel, data: PopulateData): Promise<void> { }

	public abstract getUserForwardTitle(userIndex: number, data: PopulateData): string;
	public abstract getUserReverseTitle(userIndex: number, data: PopulateData): string | null;
	public abstract getTopForwardTitles(desiredLength: number, data: PopulateData): string[];
	public abstract getTopReverseTitles(desiredLength: number, data: PopulateData): string[] | null;
	
}

export abstract class ValueTitle extends Title
{
	public readonly forwardDescription: string;
	public readonly reverseDescription: string | null;
	public readonly valueFormatter: (value: number) => string;

	public constructor(param: { forwardTitle: string, reverseTitle?: string, forwardDescription: string, reverseDescription?: string, valueFormatter?: (value: number) => string })
	{
		super(param);
		this.forwardDescription = param.forwardDescription;
		this.reverseDescription = param.reverseDescription ?? null;
		this.valueFormatter = param.valueFormatter ?? ((value: number) => value.toString());
	}

	protected values: number[] = [];
	protected sortedIndices: number[] = [];

	public override getUserForwardTitle(userIndex: number, data: PopulateData): string
	{
		return Title.formatTitle(userIndex, this.forwardTitle, this.forwardDescription.replace("{value}", this.valueFormatter(this.values[userIndex])));
	}

	public override getUserReverseTitle(userIndex: number, data: PopulateData): string | null
	{
		if (!this.reverseTitle || !this.reverseDescription)
		{
			return null;
		}

		return Title.formatTitle(userIndex, this.reverseTitle, this.reverseDescription.replace("{value}", this.valueFormatter(this.values[userIndex])));
	}

	public override getTopForwardTitles(desiredLength: number, data: PopulateData): string[]
	{
		const titles: string[] = [];

		for (let i = 0; i < desiredLength; i++)
		{
			const index = this.sortedIndices[i];

			if (index === undefined)
				break;
			
			titles.push(this.getUserForwardTitle(index, data));
		}

		return titles;
	}

	public override getTopReverseTitles(desiredLength: number, data: PopulateData): string[] | null
	{
		if (!this.reverseTitle)
			return null;
		
		const titles: string[] = [];

		for (let i = 0; i < desiredLength; i++)
		{
			const index = this.sortedIndices[this.sortedIndices.length - i - 1];

			if (index === undefined)
				break;
			
			titles.push(this.getUserReverseTitle(index, data)!);
		}

		return titles;
	}
}

export class UserEntryDataTitle<T extends UserEntryData> extends ValueTitle
{
	public readonly type: T;

	public constructor(type: T, param: { forwardTitle: string, reverseTitle?: string, forwardDescription: string, reverseDescription?: string, valueFormatter?: (value: number) => string })
	{
		super(param);
		this.type = type;
	}

	public override async beginPopulation(data: PopulateData)
	{
		const values = await UserData.getColumnNumberData(data.guild.id, this.type);

		for (let i = 0; i < data.activeUsers.length; i++)
		{
			this.values.push(values[data.activeUsers[i][1]]);
			this.sortedIndices.push(i);
		}

		this.sortedIndices.sort((a, b) => this.values[b] - this.values[a]);
	}
}