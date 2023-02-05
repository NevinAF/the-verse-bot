import Debug from "@/debug";
import { Delegate } from "@/types";
import Resolvers from "@/util/Resolvers";

export class UsageData
{
	public chatCommandsUsed: number = 0;
	public messageContextMenusUsed: number = 0;
	public userContextMenusUsed: number = 0;
	public buttonsUsed: number = 0;
	public modalsUsed: number = 0;
}

export class Usage
{
	private static data = new UsageData();

	public static get<T extends keyof UsageData>(key: T): UsageData[T]
	{
		return Usage.data[key];
	}

	public static increment<T extends keyof UsageData>(key: T): void
	{
		Usage.data[key]++;

		Usage._onUsedCallbacks.forEach(callback => callback(key));
	}

	private static _onUsedCallbacks: Delegate<[keyof UsageData]>[] = [];
	public static onUsed(callback: Delegate<[keyof UsageData]>): void
	{
		Usage._onUsedCallbacks.push(callback);
	}

	public static onKeyUsed<T extends keyof UsageData>(key: T, callback: Delegate<[newValue: UsageData[T]]>): void
	{
		Usage.onUsed((usedKey) =>
		{
			if (usedKey === key)
			{
				callback(Usage.get(key));
			}
		});
	}
}