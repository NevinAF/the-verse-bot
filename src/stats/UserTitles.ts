import { UserEntryData } from "@/database/UserDataModuleSheet";

export interface UserTitle<T extends UserEntryData>
{
	readonly userId: string;
	readonly title: string;
	readonly type: T;
	readonly description: string;
	readonly rarity: number;
}