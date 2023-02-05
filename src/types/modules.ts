import { GoogleSheets } from "@/apis";
import ClientWrapper from "@/ClientWrapper";
import Debug from "@/debug";
import { ButtonInteraction, CacheType, ChatInputCommandInteraction, Client, CommandInteraction, ContextMenuCommandBuilder, Guild, GuildMember, GuildScheduledEvent, Interaction, Message, MessageContextMenuCommandInteraction, MessageReaction, ModalSubmitInteraction, SlashCommandBuilder, ThreadChannel, Typing, User, UserContextMenuCommandInteraction, VoiceState } from "discord.js";
import { PresenceStamp, VoiceStateStamp } from "./discordExtended";
import { Delegate } from "./functions";

/** Discord command which describes the info and args of a command. Used for registering and pushing commands to the discord server.
 * Type is defined for convenience and clarity. */
export type ChatCommand = Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

/** All discord commands and callbacks should be registered through the module interface. Intended as an export type of module files. */
export interface BotModule
{
	onReady?: [callback: Delegate<[client?: Client]>];
	onMessageCreate?: [callback: Delegate<[message?: Message]>];
	onMessageUpdate?: [callback: Delegate<[oldMessage: Message, newMessage: Message]>];
	onMessageDelete?: [callback: Delegate<[message?: Message]>];
	onInteractionCreate?: [callback: Delegate<[interaction?: Interaction]>];
	registerVoiceStateUpdate?: [callback: Delegate<[oldState: VoiceStateStamp, newState: VoiceStateStamp]>];
	registerChatCommand?: [command: ChatCommand, callback: Delegate<[interaction: ChatInputCommandInteraction<CacheType>]>];
	registerUserContextMenu?: [menuCommand: ContextMenuCommandBuilder, callback: Delegate<[interaction: UserContextMenuCommandInteraction<CacheType>]>];
	registerMessageContextMenu?: [menuCommand: ContextMenuCommandBuilder, callback: Delegate<[interaction: MessageContextMenuCommandInteraction<CacheType>]>];
	registerButton?: [button_key: string | RegExp, callback: Delegate<[interaction: ButtonInteraction<CacheType>]>];
	registerModalSubmit?: [modal_key: string, callback: Delegate<[interaction: ModalSubmitInteraction<CacheType>]>];
	registerBackup?: [callback: Delegate<[crashed?: boolean]>];
	onExiting?: [callback: Delegate<[]>];
	onCrash?: [callback: () => void];
	registerGuildCreate?: [callback: Delegate<[guild: Guild]>];
	registerPresenceUpdate?: [callback: Delegate<[PresenceStamp, PresenceStamp]>];
	registerThreadCreate ?: [callback: Delegate<[ThreadChannel]>];
	registerThreadDelete?: [callback: Delegate<[ThreadChannel]>];
	registerThreadUpdate?: [callback: Delegate<[ThreadChannel, ThreadChannel]>];
	registerGuildScheduledEventCreate?: [callback: Delegate<[GuildScheduledEvent]>];
	registerGuildScheduledEventDelete?: [callback: Delegate<[GuildScheduledEvent]>];
	registerGuildScheduledEventUpdate?: [callback: Delegate<[GuildScheduledEvent, GuildScheduledEvent]>];
	registerGuildScheduledEventUserAdd?: [callback: Delegate<[GuildScheduledEvent, User]>];
	registerGuildScheduledEventUserRemove?: [callback: Delegate<[GuildScheduledEvent, User]>];
	registerGuildMemberAdd?: [callback: Delegate<[GuildMember]>];
	registerGuildMemberRemove?: [callback: Delegate<[GuildMember]>];
	registerGuildMemberUpdate?: [callback: Delegate<[GuildMember, GuildMember]>];
	registerMessageReactionAdd?: [callback: Delegate<[MessageReaction, User]>];
	registerMessageReactionRemove?: [callback: Delegate<[MessageReaction, User]>];
	registerMessageReactionRemoveAll?: [callback: Delegate<[MessageReaction]>];
	registerMessageReactionRemoveEmoji?: [callback: Delegate<[MessageReaction]>];
	registerTypingStart?: [callback: Delegate<[Typing]>];

}

function sheetValuesToNumber(data: string[][]): number { return data ? Number.parseInt(data[0][0]) : Infinity; }
function sheetValuesToString(data: string[][]): string { return data ? data[0][0] : ""; }
function sheetValuesToNumberArray(data: string[][]): number[]
{
	if (!data)
		return [];

	const result: number[] = [];
	for (const row of data)
		for (const cell of row)
			result.push(Number.parseInt(cell));
	return result;
}
function sheetValuesToStringArray(data: string[][]): string[]
{
	if (!data)
		return [];

	const result: string[] = [];
	for (const row of data)
		for (const cell of row)
			result.push(cell);
	return result;
}
function sheetValuesToNumberMatrix(data: string[][]): number[][] { return data ? data.map(row => row.map(cell => Number.parseInt(cell))) : []; }
function sheetValuesToStringMatrix(data: string[][]): string[][] { return data ? data : []; }

function numberToSheetValues(data: number): string[][] { return [[data.toString()]] }
function stringToSheetValues(data: string): string[][] { return [[data]] }
function numberArrayToSheetValues(data: number[]): string[][] { return [data.map(d => d.toString())] }
function stringArrayToSheetValues(data: string[]): string[][] { return [data] }
function numberMatrixToSheetValues(data: number[][]): string[][] { return data.map(row => row.map(cell => cell.toString())) }
function stringMatrixToSheetValues(data: string[][]): string[][] { return data }

function copyValue<T extends number | string>(value: T): T { return value; }
function copyArrayValue<T extends number | string>(data: T[]): T[] { return data.map(cell => cell); }
function copyMatrixValue<T extends number | string>(data: T[][]): T[][] { return data.map(row => row.map(cell => cell)); }

export const SheetEntryTypes = {
	Number: {
		get: sheetValuesToNumber,
		set: numberToSheetValues,
		copy: copyValue,
	},
	String: {
		get: sheetValuesToString,
		set: stringToSheetValues,
		copy: copyValue,
	},
	NumberArray: {
		get: sheetValuesToNumberArray,
		set: numberArrayToSheetValues,
		copy: copyArrayValue,
	},
	StringArray: {
		get: sheetValuesToStringArray,
		set: stringArrayToSheetValues,
		copy: copyArrayValue,
	},
	NumberMatrix: {
		get: sheetValuesToNumberMatrix,
		set: numberMatrixToSheetValues,
		copy: copyMatrixValue,
	},
	StringMatrix: {
		get: sheetValuesToStringMatrix,
		set: stringMatrixToSheetValues,
		copy: copyMatrixValue,
	},
	ReadonlyNumber: {
		get: sheetValuesToNumber,
		set: null,
		copy: null,
	}
} as const;

/** Configuration and data for modules, saved and backed up in a sheet style document, like Google Sheets */
export class ModuleSheet
{
	public readonly sheetName: string;
	public readonly entries: ModuleSheetEntry<keyof typeof SheetEntryTypes>[];

	constructor(sheetName: string, entries: ModuleSheetEntry<keyof typeof SheetEntryTypes>[])
	{
		this.sheetName = sheetName;
		this.entries = entries;

		this.entries.forEach(entry => entry.moduleSheet = this);

		if (this.entries.length == 0)
		{
			Debug.warning(`ModuleSheet ${sheetName} has no entries.`);
		}
	}

	public async fetch(guildId: string): Promise<void>
	{
		if (this.entries.length === 0)
			return;

		let rowStart = null;
		let rowEnd = null;
		let colStart = null;
		let colEnd = null;

		for (const entry of this.entries)
		{
			if (rowStart === null || entry.rowStart < rowStart)
				rowStart = entry.rowStart;

			if (rowEnd === null || entry.rowEnd > rowEnd)
				rowEnd = entry.rowEnd;

			if (colStart === null || entry.columnStart < colStart)
				colStart = entry.columnStart;

			if (colEnd === null || entry.columnEnd > colEnd)
				colEnd = entry.columnEnd;
		}

		Debug.log("Fetching sheet id: " + guildId + " sheet: " + this.sheetName + " range: " + rowStart + ":" + colStart + " to " + rowEnd + ":" + colEnd);

		const sheetValues = await GoogleSheets.Read({
			spreadsheetId: ClientWrapper.sheetIds.get(guildId),
			range: `${this.sheetName}!${GoogleSheets.GetColumnLetter(colStart)}${rowStart}:${GoogleSheets.GetColumnLetter(colEnd)}${rowEnd}`
		}).catch(Debug.error);

		if (sheetValues)
		{
			for (const entry of this.entries)
			{
				const matrixSlice = sheetValues.slice(entry.rowStart - rowStart, entry.rowEnd - rowStart + 1).map(row => row.slice(entry.columnStart - colStart, entry.columnEnd - colStart + 1));
				entry._set_cache(guildId, matrixSlice);
			}
		}
		else for (const entry of this.entries)
			entry._set_cache(guildId, null);
	}

	public async push(guildId: string): Promise<void>
	{
		if (this.entries.length === 0)
			return;
		
		for (const entry of this.entries)
			await entry.push?.(guildId);
	}

	public async pushAll(): Promise<void>
	{
		Debug.log(`.....Pushing all entries for ${this.sheetName}...`);
		if (this.entries.length === 0)
			return;
		
		Debug.log(`Pushing all entries for ${this.sheetName}...`);
		
		for (const entry of this.entries)
			await entry.pushAll();
	}
}

export class ModuleSheetEntry<Type extends keyof typeof SheetEntryTypes>
{
	public moduleSheet: ModuleSheet;
	public readonly type: Type;

	public readonly rowStart: number;
	public readonly rowEnd: number;
	public readonly columnStart: number;
	public readonly columnEnd: number;

	public get width(): number { return this.columnEnd - this.columnStart + 1; }
	public get height(): number { return this.rowEnd - this.rowStart + 1; }

	protected _cache: Map<string, ReturnType<typeof SheetEntryTypes[Type]["get"]>>;
	public get cache(): Map<string, ReturnType<typeof SheetEntryTypes[Type]["get"]>> { return this._cache; }

	// protected _lastUpdatedTime: number;
	// public get lastUpdatedTime(): number { return this._lastUpdatedTime; }

	constructor(type: Type, config: { rowStart: number, rowEnd?: number, columnStart: number, columnEnd?: number })
	{
		this.type = type;

		this.rowStart = config.rowStart;
		this.rowEnd = config.rowEnd ?? config.rowStart;
		this.columnStart = config.columnStart;
		this.columnEnd = config.columnEnd ?? config.columnStart;
	}

	public _set_cache(guildId: string, data: string[][]): void
	{
		if (this._cache === undefined)
		{
			this._cache = new Map();
		}

		this._cache.set(guildId, SheetEntryTypes[this.type]["get"](data) as ReturnType<typeof SheetEntryTypes[Type]["get"]>);
	}

	public async fetch(guildId: string): Promise<ReturnType<typeof SheetEntryTypes[Type]["get"]>>
	{
		if (this._cache === undefined || !this._cache.has(guildId))
		{
			await this.moduleSheet.fetch(guildId);
		}

		return this._cache.get(guildId);
	}

	public push(guildId: string): Promise<void> { return }
	public pushAll(): Promise<void> { return }
}

export class WritableModuleSheetEntry<Type extends keyof typeof SheetEntryTypes> extends ModuleSheetEntry<Type>
{
	protected _writeCache: Map<string, ReturnType<typeof SheetEntryTypes[Type]["get"]>>;
	public get writeCache(): Map<string, ReturnType<typeof SheetEntryTypes[Type]["get"]>> { return this._writeCache; }

	public _set_cache(guildId: string, data: string[][]): void
	{
		super._set_cache(guildId, data);

		if (this._writeCache === undefined)
		{
			this._writeCache = new Map();
		}

		for (const [key, value] of this._cache)
		{
			if (!this._writeCache.has(key))
				this._writeCache.set(key, SheetEntryTypes[this.type]["copy"](value));
		}
	}

	public async fetch(guildId: string): Promise<ReturnType<typeof SheetEntryTypes[Type]["get"]>>
	{
		if (this._writeCache === undefined || !this._writeCache.has(guildId))
		{
			await this.moduleSheet.fetch(guildId);
		}

		return this._writeCache.get(guildId);
	}

	public override async push(guildId: string): Promise<void>
	{
		if (this._writeCache === undefined)
		{
			Debug.warning(`ModuleSheetEntry ${this.moduleSheet.sheetName} ${this.type} has no write cache.`);
			return;
		}

		if (!this._writeCache.has(guildId))
		{
			Debug.warning(`ModuleSheetEntry ${this.moduleSheet.sheetName} ${this.type} has no write cache for guild ${guildId}.`);
			return;
		}

		const _data = SheetEntryTypes[this.type]["set"](this._writeCache.get(guildId));

		if (_data === null)
		{
			Debug.warning(`ModuleSheetEntry ${this.moduleSheet.sheetName} ${this.type} has no data to push.`);
			return;
		}

		Debug.log(`Pushing ${this.moduleSheet.sheetName} ${this.type} for guild ${guildId} to Google Sheets (${this.moduleSheet.sheetName}!${GoogleSheets.GetColumnLetter(this.columnStart)}${this.rowStart}:${GoogleSheets.GetColumnLetter(this.columnEnd)}${this.rowEnd})`);

		await GoogleSheets.Update({
			spreadsheetId: ClientWrapper.sheetIds.get(guildId),
			range: `${this.moduleSheet.sheetName}!${GoogleSheets.GetColumnLetter(this.columnStart)}${this.rowStart}:${GoogleSheets.GetColumnLetter(this.columnEnd)}${this.rowEnd}`,
			requestBody: {
				values: _data
			}
		}).then((data) =>
		{
			for (const [key, value] of this._writeCache)
			{
				this._cache.set(key, SheetEntryTypes[this.type]["copy"](value));
			}
		}).catch((error) =>
		{
			Debug.error(`Error!`, error);
		});
	}

	public override async pushAll(): Promise<void>
	{
		if (this._writeCache === undefined)
			return;
		
		for await (const [guildId, data] of this._writeCache)
		{
			await this.push(guildId);
		}
	}
}

export type RowSearch = { column: number, compareValue: string } | number;

export class WritableColumnedMatrixSheet extends WritableModuleSheetEntry<"StringMatrix">
{
	public constructor(config: { rowStart: number, rowEnd?: number, columnStart: number, columnEnd?: number })
	{
		super("StringMatrix", config);
	}

	private static getRow(data: string[][], search: RowSearch): number
	{
		if (typeof search === "number")
			return (search < 0 || search >= data.length) ? -1 : search;

		return data.findIndex((row) => row[search.column] === search.compareValue);
	}

	public getData(guildId: string): Promise<string[][]>
	{
		return this.fetch(guildId);
	}

	public getRowData(guildId: string, rowSearch: RowSearch): Promise<string[] | undefined>
	{
		return this.fetch(guildId).then((data) =>
		{
			const index = WritableColumnedMatrixSheet.getRow(data, rowSearch);

			if (index === -1)
				return undefined;
			
			return data[index];
		});
	}

	public getColumnStringData(guildId: string, column: number): Promise<readonly string[]>
	{
		return this.fetch(guildId).then((data) => data.map((row) => row[column]));
	}

	public getCellStringData(guildId: string, rowSearch: RowSearch, column: number): Promise<string | undefined>
	{
		return this.getRowData(guildId, rowSearch).then((data) => data?.[column]);
	}

	public getColumnNumberData(guildId: string, column: number): Promise<readonly number[]>
	{
		return this.getColumnStringData(guildId, column).then((data) => data.map((cell) => cell == "" ? 0 : Number(cell)));
	}

	public getCellNumberData(guildId: string, rowSearch: RowSearch, column: number): Promise<number | undefined>
	{
		return this.getCellStringData(guildId, rowSearch, column).then((data) => (!data || Number.isNaN(data) || data == "") ? 0 : Number(data));
	}

	public getColumnBooleanData(guildId: string, column: number): Promise<readonly boolean[]>
	{
		return this.getColumnStringData(guildId, column).then((data) => data.map((cell) => cell == "true"));
	}

	public getCellBooleanData(guildId: string, rowSearch: RowSearch, column: number): Promise<boolean | undefined>
	{
		return this.getCellStringData(guildId, rowSearch, column).then((data) => data ? data == "true" : undefined);
	}

	public writeCellData(guildId: string, rowSearch: RowSearch, entry: number, data: string | number | boolean): Promise<void>
	{
		return this.writeUserData(guildId, rowSearch, [[entry, data]]);
	}

	public writeUserData(guildId: string, rowSearch: RowSearch, data: [entry: number, cell: string | number | boolean][]): Promise<void>
	{
		return this.fetch(guildId).then((sheetData) =>
		{
			let index = WritableColumnedMatrixSheet.getRow(sheetData, rowSearch);
			if (index === -1)
			{
				const newRow = new Array(this.width).fill("");
				index = sheetData.push(newRow) - 1;

				if (typeof rowSearch !== "number")
				{
					newRow[rowSearch.column] = rowSearch.compareValue;
				}
			}

			for (const [entry, cell] of data)
			{
				sheetData[index][entry] = cell.toString();
			}
		});
	}

	public incrementCell(guildId: string, rowSearch: RowSearch, column: number, amount: number = 1): Promise<void>
	{
		return this.getCellNumberData(guildId, rowSearch, column).then((data) => this.writeCellData(guildId, rowSearch, column, data + amount));
	}
}