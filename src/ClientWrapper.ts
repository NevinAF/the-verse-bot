import { ApplicationCommandType, ButtonInteraction, CacheType, Channel, ChannelManager, ChatInputCommandInteraction, Client, CommandInteraction, ContextMenuCommandBuilder, GatewayIntentBits, Guild, GuildMember, GuildScheduledEvent, Interaction, Message, MessageContextMenuCommandInteraction, MessageReaction, ModalSubmitInteraction, PermissionFlagsBits, PermissionResolvable, PermissionsBitField, Presence, Routes, ThreadChannel, Typing, User, UserContextMenuCommandInteraction, VoiceState } from "discord.js";
import { ChatCommand, Delegate, BotModule, ModuleSheet, VoiceStateStamp, PresenceStamp } from "@/types";
import Debug from "@/debug";
import Resolvers from "@/util/Resolvers";
import { Authors, Fetching } from "@/messaging";

class ExtraGuildData
{
	public readonly VoiceStateStamps: Map<string, number> = new Map();
	public readonly PresenceStamps: Map<string, number> = new Map();

	public getAndUpdateVoiceStateStamp(userId: string, now: number): number
	{
		const stamp = this.VoiceStateStamps.get(userId) ?? ClientWrapper.Client.readyTimestamp;
		this.VoiceStateStamps.set(userId, now);
		return stamp;
	}

	public getAndUpdatePresenceStamp(userId: string, now: number, readyTime?: number ): number
	{
		const stamp = this.PresenceStamps.get(userId) ?? readyTime ?? ClientWrapper.Client.readyTimestamp;
		this.PresenceStamps.set(userId, now);
		return stamp;
	}
}

class ClientWrapper
{
	private static instance: ClientWrapper;
	public static get Instance(): ClientWrapper { return ClientWrapper.instance; }

	private crashed: boolean = false;
	public isCrashed(): boolean { return ClientWrapper.Instance.crashed; }

	private client: Client;
	public static get Client(): Client { return ClientWrapper.Instance.client; }
	public static get ClientID(): string { return ClientWrapper.Instance.client.user.id; }
	public static get ClientChannels(): ChannelManager { return ClientWrapper.Instance.client.channels; }
	public static get ClientUptime(): number { return ClientWrapper.Instance.client.uptime; }

	private readonly extraGuildData: Map<string, ExtraGuildData> = new Map();
	public getExtraGuildData(guildId: string): ExtraGuildData
	{
		let data = this.extraGuildData.get(guildId);
		if (!data)
		{
			data = new ExtraGuildData();
			this.extraGuildData.set(guildId, data);
		}
		return data;
	}

	private token = "PRIVATE_TOKEN";

	public static sheetIds: Map<string, string> = new Map<string, string>([
		["848804519847526460", "1egVoXOyJrhC1CEBD9Ha9S0GfcvykyIu1zKGxnK8zOPY"],
		["979414788713111552", "1Yl2GE5qMn65AHA-2mejL0xkN7vL8A4MaoHKVv07LgLc"]
	])

	private readonly intents = [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
	]

	constructor(token: string)
	{
		Debug.assert(!ClientWrapper.instance, "ClientWrapper already instantiated. If this is intended, consider reworking the client wrapper to allow multiple instances.");

		ClientWrapper.instance = this;

		this.token = token;
		this.client = new Client({ intents: ClientWrapper.Instance.intents });
	}

	public async pushCommands(guild_id: string): Promise<boolean>
	{
		try
		{
			const { REST } = require('@discordjs/rest');
			const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
	
			await rest.put(
				Routes.applicationGuildCommands(
					process.env.CLIENT_ID,
					guild_id
				),
				{ body: ClientWrapper.Instance.commands },
			);

			return true;
		}
		catch (error)
		{
			Debug.error(error);
			return false;
		}
	}

	public async start()
	{
		Debug.assert(!ClientWrapper.Instance.client.isReady(), "Client is already ready. Start should only be called once.");
		
		ClientWrapper.Instance.client
			.on("ready", ClientWrapper.Instance._onReady)
			.on("messageCreate", ClientWrapper.Instance._onMessageCreate)
			.on("messageDelete", ClientWrapper.Instance._onMessageDelete)
			.on("messageUpdate", ClientWrapper.Instance._onMessageUpdate)
			.on("interactionCreate", ClientWrapper.Instance._onInteractionCreate)
			.on("voiceStateUpdate", ClientWrapper.Instance._onVoiceStateUpdate)
			.on("guildCreate", ClientWrapper.Instance._onGuildCreate)
			.on("presenceUpdate", ClientWrapper.Instance._onPresenceUpdate)
			.on("threadCreate", ClientWrapper.Instance._onThreadCreate)
			.on("threadDelete", ClientWrapper.Instance._onThreadDelete)
			.on("threadUpdate", ClientWrapper.Instance._onThreadUpdate)
			.on("typingStart", ClientWrapper.Instance._onTypingStart)
			.on("guildScheduledEventCreate", ClientWrapper.Instance._onGuildScheduledEventCreate)
			.on("guildScheduledEventDelete", ClientWrapper.Instance._onGuildScheduledEventDelete)
			.on("guildScheduledEventUpdate", ClientWrapper.Instance._onGuildScheduledEventUpdate)
			.on("guildScheduledEventUserAdd", ClientWrapper.Instance._onGuildScheduledEventUserAdd)
			.on("guildScheduledEventUserRemove", ClientWrapper.Instance._onGuildScheduledEventUserRemove)
			.on("guildMemberAdd", ClientWrapper.Instance._onGuildMemberAdd)
			.on("guildMemberRemove", ClientWrapper.Instance._onGuildMemberRemove)
			.on("guildMemberUpdate", ClientWrapper.Instance._onGuildMemberUpdate)
			.on("messageReactionAdd", ClientWrapper.Instance._onMessageReactionAdd)
			.on("messageReactionRemove", ClientWrapper.Instance._onMessageReactionRemove)
			.on("messageReactionRemoveAll", ClientWrapper.Instance._onMessageReactionRemoveAll)
			.on("messageReactionRemoveEmoji", ClientWrapper.Instance._onMessageReactionRemoveEmoji);

		ClientWrapper.Instance.client.on("error", (error) => { Debug.error(error); });
		ClientWrapper.Instance.client.on("warn", (warning) => { Debug.warning(warning); });
		
		await ClientWrapper.Instance.client.login(ClientWrapper.Instance.token);
	}

	public registerModule(module: BotModule)
	{
		const entries = Object.entries(module) as [keyof BotModule, any][];
		for (const [key, value] of entries)
		{
			Debug.assert(key in ClientWrapper.Instance, `Module tried to register unknown key: ${key}`);
			Debug.assert(typeof ClientWrapper.Instance[key] === "function", `Module tried to register key: ${key} which is not a function.`);
			ClientWrapper.Instance[key].call(ClientWrapper.Instance, ...value);
		}
	}

	private onReadyCallbacks: Delegate<[Client]>[] = [];
	private onReady(callback: Delegate<[Client]>) { ClientWrapper.Instance.onReadyCallbacks.push(callback) }
	private _onReady(client: Client)
	{
		setInterval(ClientWrapper.Instance.backup, 1000 * 60 * 60 * 24);
		ClientWrapper.Instance.onReadyCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, client));
	}

	private onMessageCreateCallbacks: Delegate<[Message<boolean>]>[] = [];
	private onMessageCreate(callback: Delegate<[Message<boolean>]>) { ClientWrapper.Instance.onMessageCreateCallbacks.push(callback) }
	private _onMessageCreate(message: Message<boolean>) { ClientWrapper.Instance.onMessageCreateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, message)); }

	private onMessageDeleteCallbacks: Delegate<[Message<boolean>]>[] = [];
	private onMessageDelete(callback: Delegate<[Message<boolean>]>) { ClientWrapper.Instance.onMessageDeleteCallbacks.push(callback) }
	private _onMessageDelete(message: Message<boolean>) { ClientWrapper.Instance.onMessageDeleteCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, message)); }

	private onMessageUpdateCallbacks: Delegate<[Message<boolean>, Message<boolean>]>[] = [];
	private onMessageUpdate(callback: Delegate<[Message<boolean>, Message<boolean>]>) { ClientWrapper.Instance.onMessageUpdateCallbacks.push(callback) }
	private _onMessageUpdate(oldMessage: Message<boolean>, newMessage: Message<boolean>) { ClientWrapper.Instance.onMessageUpdateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, oldMessage, newMessage)); }


	private onInteractionCreateCallbacks: Delegate<[Interaction<CacheType>]>[] = [];
	private onInteractionCreate(callback: Delegate<[Interaction<CacheType>]>) { ClientWrapper.Instance.onInteractionCreateCallbacks.push(callback) }

	private commands: (ChatCommand | ContextMenuCommandBuilder)[] = [];

	private onChatCommandCallbacks: Map<string, Delegate<[ChatInputCommandInteraction<CacheType>]>> = new Map();
	private registerChatCommand(command: ChatCommand, callback: Delegate<[ChatInputCommandInteraction<CacheType>]>)
	{
		Debug.assert(!ClientWrapper.Instance.client.isReady(), "Client is already ready. Cannot register chat commands after client is ready.");
		Debug.assert(!ClientWrapper.Instance.onChatCommandCallbacks.has(command.name), `Chat Command ${command.name} already registered: ${ClientWrapper.Instance.onChatCommandCallbacks.get(command.name)}\nNew Command: ${command}`);

		ClientWrapper.Instance.onChatCommandCallbacks.set(command.name, callback);
		ClientWrapper.Instance.commands.push(command);
	}

	private onUserContextMenuCallbacks: Map<string, Delegate<[UserContextMenuCommandInteraction<CacheType>]>> = new Map();
	private registerUserContextMenu(menuCommand: ContextMenuCommandBuilder, callback: Delegate<[UserContextMenuCommandInteraction<CacheType>]>)
	{
		if (ClientWrapper.Instance.client.isReady())
		{
			Debug.warning("Registering user context menu while client is already ready. This is very likely to cause user context menu to be unresponsive if/when the bot is restarted.");
		}
		Debug.assert(!ClientWrapper.Instance.onUserContextMenuCallbacks.has(menuCommand.name), `User context menu ${menuCommand.name} already registered.`);
		Debug.assert(menuCommand.type === ApplicationCommandType.User, `User context menu ${menuCommand.name} is not a user context menu.`);

		ClientWrapper.Instance.onUserContextMenuCallbacks.set(menuCommand.name, callback);
		ClientWrapper.Instance.commands.push(menuCommand);
	}

	private onMessageContextMenuCallbacks: Map<string, Delegate<[MessageContextMenuCommandInteraction<CacheType>]>> = new Map();
	private registerMessageContextMenu(menuCommand: ContextMenuCommandBuilder, callback: Delegate<[MessageContextMenuCommandInteraction<CacheType>]>)
	{
		if (ClientWrapper.Instance.client.isReady())
		{
			Debug.warning("Registering message context menu while client is already ready. This is very likely to cause message context menu to be unresponsive if/when the bot is restarted.");
		}
		Debug.assert(!ClientWrapper.Instance.onMessageContextMenuCallbacks.has(menuCommand.name), `Message context menu ${menuCommand.name} already registered.`);
		Debug.assert(menuCommand.type === ApplicationCommandType.Message, `Message context menu ${menuCommand.name} is not a message context menu.`);

		ClientWrapper.Instance.onMessageContextMenuCallbacks.set(menuCommand.name, callback);
		ClientWrapper.Instance.commands.push(menuCommand);
	}

	private onButtonCallbacks: [RegExp, Delegate<[ButtonInteraction<CacheType>]>][] = []
	private registerButton(button_key: string | RegExp, callback: Delegate<[ButtonInteraction<CacheType>]>)
	{
		if (ClientWrapper.Instance.client.isReady())
		{
			Debug.warning("Registering button while client is already ready. This is very likely to cause button to be unresponsive if/when the bot is restarted.");
		}

		if (typeof button_key === "string")
			button_key = new RegExp(button_key);

		ClientWrapper.Instance.onButtonCallbacks.push([button_key, callback]);
	}

	private onModalSubmitCallbacks: [RegExp, Delegate<[ModalSubmitInteraction<CacheType>]>][] = [];
	private registerModalSubmit(modal_key: string | RegExp, callback: Delegate<[ModalSubmitInteraction<CacheType>]>)
	{
		if (ClientWrapper.Instance.client.isReady())
		{
			Debug.warning("Registering modal while client is already ready. This is very likely to cause modal to be unresponsive if/when the bot is restarted.");
		}
		if (typeof modal_key === "string")
			modal_key = new RegExp(modal_key);

		ClientWrapper.Instance.onModalSubmitCallbacks.push([modal_key, callback]);
	}

	private _onInteractionCreate(interaction: Interaction<CacheType>)
	{
		ClientWrapper.Instance.onInteractionCreateCallbacks.forEach(callback => callback(interaction));
		
		if (interaction.isUserContextMenuCommand())
		{
			const callback = ClientWrapper.Instance.onUserContextMenuCallbacks.get(interaction.commandName);
			if (callback) Resolvers.safelyInvokeDelegate(callback, interaction);
		}

		else if (interaction.isMessageContextMenuCommand())
		{
			const callback = ClientWrapper.Instance.onMessageContextMenuCallbacks.get(interaction.commandName);
			if (callback) Resolvers.safelyInvokeDelegate(callback, interaction);
		}

		else if (interaction.isChatInputCommand())
		{
			const callback = ClientWrapper.Instance.onChatCommandCallbacks.get(interaction.commandName);
			if (callback) Resolvers.safelyInvokeDelegate(callback, interaction)
		}

		else if (interaction.isButton())
		{
			const callbacks = ClientWrapper.Instance.onButtonCallbacks.filter(([key, _]) => key.test(interaction.customId));

			if (callbacks.length > 0)
			{
				if (callbacks.length > 1)
					Debug.warning(`Multiple callbacks registered for button ${interaction.customId}: ` + callbacks.map(([key, _]) => key).join(", "));
				callbacks.forEach(([_, callback]) => Resolvers.safelyInvokeDelegate(callback, interaction));
			}
		}

		else if (interaction.isModalSubmit())
		{
			const callbacks = ClientWrapper.Instance.onModalSubmitCallbacks.filter(([key, _]) => key.test(interaction.customId));
			
			if (callbacks.length > 0)
			{
				if (callbacks.length > 1)
					Debug.warning(`Multiple callbacks registered for modal ${interaction.customId}: ` + callbacks.map(([key, _]) => key).join(", "));
				callbacks.forEach(([_, callback]) => Resolvers.safelyInvokeDelegate(callback, interaction));
			}
		}
	}

	private onVoiceStateUpdateCallbacks: Delegate<[VoiceStateStamp, VoiceStateStamp]>[] = [];
	private registerVoiceStateUpdate(callback: Delegate<[VoiceStateStamp, VoiceStateStamp]>)
	{
		ClientWrapper.Instance.onVoiceStateUpdateCallbacks.push(callback);
	}
	private _onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState)
	{
		const currentTime = Date.now();
		const oldTime = ClientWrapper.Instance.getExtraGuildData(oldState?.guild?.id ?? newState.guild.id).getAndUpdateVoiceStateStamp(oldState?.member?.id ?? newState.member.id, currentTime);

		ClientWrapper.Instance.onVoiceStateUpdateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback,
			{ state: oldState, timestamp: oldTime },
			{ state: newState, timestamp: currentTime }));
	}

	private onExitingCallbacks: Delegate<[]>[] = [];
	private onExiting(callback: Delegate<[]>) { ClientWrapper.Instance.onExitingCallbacks.push(callback) }
	public exit()
	{
		return Promise.all(ClientWrapper.Instance.onExitingCallbacks.map(callback => Resolvers.safelyInvokeDelegate(callback))).then(() => ClientWrapper.Instance._backup(false));
	}

	private crashCallbacks: (() => void)[] = [];
	private onCrash(callback: () => void) { ClientWrapper.Instance.crashCallbacks.push(callback) }
	public crash()
	{
		const wasCrashed = ClientWrapper.Instance.crashed;
		ClientWrapper.Instance.crashed = true;

		ClientWrapper.Instance.crashCallbacks.forEach(callback => callback());
	}

	private backupCallbacks: Delegate<[crashed?: boolean]>[] = [];
	private registerBackup(callback: Delegate<[crashed?: boolean]>) { ClientWrapper.Instance.backupCallbacks.push(callback) }
	public _backup(crashed: boolean)
	{
		Debug.log("Backing up..." + ClientWrapper.Instance.moduleSheets.map(sheet => sheet.sheetName).join(", "));

		return Promise.all([
			Promise.all(ClientWrapper.Instance.backupCallbacks.map(callback => Resolvers.safelyInvokeDelegate(callback, crashed)))
				.then(() => Debug.event("Backup", "Backup complete.")),
			Promise.all(ClientWrapper.Instance.moduleSheets.map(sheet => sheet.pushAll().catch(e => Debug.error("Error pushing module sheet: " + sheet.sheetName, e))))
				.then(() => Debug.event("Backup", "Module sheets pushed."))
		]);
	}
	public backup()
	{
		return ClientWrapper.Instance._backup(false);
	}

	private moduleSheets: ModuleSheet[] = null;
	public registerModuleSheets(moduleSheet: ModuleSheet[])
	{
		if (ClientWrapper.Instance.moduleSheets)
		{
			Debug.warning("Module sheets already registered!");
			return;
		}

		ClientWrapper.Instance.moduleSheets = moduleSheet;
	}
	public async updateModuleSheets(guildId)
	{
		await Promise.all(ClientWrapper.Instance.moduleSheets.map(moduleSheet => moduleSheet.fetch(guildId)));
	}

	private onGuildCreateCallbacks: Delegate<[Guild]>[] = [];
	private registerGuildCreate(callback: Delegate<[Guild]>) { ClientWrapper.Instance.onGuildCreateCallbacks.push(callback) }
	private _onGuildCreate(guild: Guild)
	{
		ClientWrapper.Instance.onGuildCreateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, guild));
	}

	private onPresenceUpdateCallbacks: Delegate<[PresenceStamp, PresenceStamp]>[] = [];
	private registerPresenceUpdate(callback: Delegate<[PresenceStamp, PresenceStamp]>) { ClientWrapper.Instance.onPresenceUpdateCallbacks.push(callback) }
	private _onPresenceUpdate(oldPresence: Presence, newPresence: Presence)
	{
		const currentTime = Date.now();
		const oldTime = ClientWrapper.Instance.getExtraGuildData(oldPresence?.guild?.id ?? newPresence.guild.id).getAndUpdatePresenceStamp(oldPresence?.member?.id ?? newPresence.member.id, currentTime);

		ClientWrapper.Instance.onPresenceUpdateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback,
			{ presence: oldPresence, timestamp: oldTime },
			{ presence: newPresence, timestamp: currentTime }));
	}

	private onThreadCreateCallbacks: Delegate<[ThreadChannel]>[] = [];
	private registerThreadCreate(callback: Delegate<[ThreadChannel]>) { ClientWrapper.Instance.onThreadCreateCallbacks.push(callback) }
	private _onThreadCreate(thread: ThreadChannel)
	{
		ClientWrapper.Instance.onThreadCreateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, thread));
	}
	
	private onThreadDeleteCallbacks: Delegate<[ThreadChannel]>[] = [];
	private registerThreadDelete(callback: Delegate<[ThreadChannel]>) { ClientWrapper.Instance.onThreadDeleteCallbacks.push(callback) }
	private _onThreadDelete(thread: ThreadChannel)
	{
		ClientWrapper.Instance.onThreadDeleteCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, thread));
	}

	private onThreadUpdateCallbacks: Delegate<[ThreadChannel, ThreadChannel]>[] = [];
	private registerThreadUpdate(callback: Delegate<[ThreadChannel, ThreadChannel]>) { ClientWrapper.Instance.onThreadUpdateCallbacks.push(callback) }
	private _onThreadUpdate(oldThread: ThreadChannel, newThread: ThreadChannel)
	{
		ClientWrapper.Instance.onThreadUpdateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, oldThread, newThread));
	}

	private onGuildScheduledEventCreateCallbacks: Delegate<[GuildScheduledEvent]>[] = [];
	private registerGuildScheduledEventCreate(callback: Delegate<[GuildScheduledEvent]>) { ClientWrapper.Instance.onGuildScheduledEventCreateCallbacks.push(callback) }
	private _onGuildScheduledEventCreate(event: GuildScheduledEvent)
	{
		ClientWrapper.Instance.onGuildScheduledEventCreateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, event));
	}

	private onGuildScheduledEventDeleteCallbacks: Delegate<[GuildScheduledEvent]>[] = [];
	private registerGuildScheduledEventDelete(callback: Delegate<[GuildScheduledEvent]>) { ClientWrapper.Instance.onGuildScheduledEventDeleteCallbacks.push(callback) }
	private _onGuildScheduledEventDelete(event: GuildScheduledEvent)
	{
		ClientWrapper.Instance.onGuildScheduledEventDeleteCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, event));
	}

	private onGuildScheduledEventUpdateCallbacks: Delegate<[GuildScheduledEvent, GuildScheduledEvent]>[] = [];
	private registerGuildScheduledEventUpdate(callback: Delegate<[GuildScheduledEvent, GuildScheduledEvent]>) { ClientWrapper.Instance.onGuildScheduledEventUpdateCallbacks.push(callback) }
	private _onGuildScheduledEventUpdate(oldEvent: GuildScheduledEvent, newEvent: GuildScheduledEvent)
	{
		ClientWrapper.Instance.onGuildScheduledEventUpdateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, oldEvent, newEvent));
	}

	private onGuildScheduledEventUserAddCallbacks: Delegate<[GuildScheduledEvent, User]>[] = [];
	private registerGuildScheduledEventUserAdd(callback: Delegate<[GuildScheduledEvent, User]>) { ClientWrapper.Instance.onGuildScheduledEventUserAddCallbacks.push(callback) }
	private _onGuildScheduledEventUserAdd(event: GuildScheduledEvent, user: User)
	{
		ClientWrapper.Instance.onGuildScheduledEventUserAddCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, event, user));
	}

	private onGuildScheduledEventUserRemoveCallbacks: Delegate<[GuildScheduledEvent, User]>[] = [];
	private registerGuildScheduledEventUserRemove(callback: Delegate<[GuildScheduledEvent, User]>) { ClientWrapper.Instance.onGuildScheduledEventUserRemoveCallbacks.push(callback) }
	private _onGuildScheduledEventUserRemove(event: GuildScheduledEvent, user: User)
	{
		ClientWrapper.Instance.onGuildScheduledEventUserRemoveCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, event, user));
	}

	private onGuildMemberAddCallbacks: Delegate<[GuildMember]>[] = [];
	private registerGuildMemberAdd(callback: Delegate<[GuildMember]>) { ClientWrapper.Instance.onGuildMemberAddCallbacks.push(callback) }
	private _onGuildMemberAdd(member: GuildMember)
	{
		ClientWrapper.Instance.onGuildMemberAddCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, member));
	}

	private onGuildMemberRemoveCallbacks: Delegate<[GuildMember]>[] = [];
	private registerGuildMemberRemove(callback: Delegate<[GuildMember]>) { ClientWrapper.Instance.onGuildMemberRemoveCallbacks.push(callback) }
	private _onGuildMemberRemove(member: GuildMember)
	{
		ClientWrapper.Instance.onGuildMemberRemoveCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, member));
	}

	private onGuildMemberUpdateCallbacks: Delegate<[GuildMember, GuildMember]>[] = [];
	private registerGuildMemberUpdate(callback: Delegate<[GuildMember, GuildMember]>) { ClientWrapper.Instance.onGuildMemberUpdateCallbacks.push(callback) }
	private _onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember)
	{
		ClientWrapper.Instance.onGuildMemberUpdateCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, oldMember, newMember));
	}

	private onMessageReactionAddCallbacks: Delegate<[MessageReaction, User]>[] = [];
	private registerMessageReactionAdd(callback: Delegate<[MessageReaction, User]>) { ClientWrapper.Instance.onMessageReactionAddCallbacks.push(callback) }
	private _onMessageReactionAdd(reaction: MessageReaction, user: User)
	{
		ClientWrapper.Instance.onMessageReactionAddCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, reaction, user));
	}

	private onMessageReactionRemoveCallbacks: Delegate<[MessageReaction, User]>[] = [];
	private registerMessageReactionRemove(callback: Delegate<[MessageReaction, User]>) { ClientWrapper.Instance.onMessageReactionRemoveCallbacks.push(callback) }
	private _onMessageReactionRemove(reaction: MessageReaction, user: User)
	{
		ClientWrapper.Instance.onMessageReactionRemoveCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, reaction, user));
	}

	private onMessageReactionRemoveAllCallbacks: Delegate<[Message]>[] = [];
	private registerMessageReactionRemoveAll(callback: Delegate<[Message]>) { ClientWrapper.Instance.onMessageReactionRemoveAllCallbacks.push(callback) }
	private _onMessageReactionRemoveAll(message: Message)
	{
		ClientWrapper.Instance.onMessageReactionRemoveAllCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, message));
	}

	private onMessageReactionRemoveEmojiCallbacks: Delegate<[MessageReaction]>[] = [];
	private registerMessageReactionRemoveEmoji(callback: Delegate<[MessageReaction]>) { ClientWrapper.Instance.onMessageReactionRemoveEmojiCallbacks.push(callback) }
	private _onMessageReactionRemoveEmoji(reaction: MessageReaction)
	{
		ClientWrapper.Instance.onMessageReactionRemoveEmojiCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, reaction));
	}

	private onTypingStartCallbacks: Delegate<[Typing]>[] = [];
	private registerTypingStart(callback: Delegate<[Typing]>) { ClientWrapper.Instance.onTypingStartCallbacks.push(callback) }
	private _onTypingStart(typing: Typing)
	{
		ClientWrapper.Instance.onTypingStartCallbacks.forEach(callback => Resolvers.safelyInvokeDelegate(callback, typing));
	}

	private static _applyPermissionsAndRoles<T extends ButtonInteraction | CommandInteraction>(
		callback: Delegate<[T]>,
		permissions?: PermissionResolvable,
		roles?: string[]
	): Delegate<[T]>
	{
		if (!permissions && !roles) return callback;
		
		return async function (interaction: T)
		{
			if (permissions)
			{
				const hasPerms = await Fetching.interactionPermissions(interaction, permissions)
				if (!hasPerms)
				{
					const perms: string = new PermissionsBitField(permissions).toArray().join(", ");
					
					return await interaction.reply({
						embeds: [{
							author: Authors.Error,
							description: `You do not have permission to use this command: ${perms}. If you believe this is a mistake, contact a server administrator.`,
						}],
						ephemeral: true
					});
				}
			}

			if (roles)
			{
				const hasRoles = await Fetching.interactionRoles(interaction, roles)
				if (!hasRoles)
					return await interaction.reply({
						embeds: [{
							author: Authors.Error,
							description: `You do not have a required role to use this command: ${
								roles.map(role => `<@&${role}>`).join(", ")
							}. If you believe this is a mistake, contact a server administrator.`,
						}],
						ephemeral: true
					});
			}

			return await callback(interaction);
		}
	}
}

export default ClientWrapper;