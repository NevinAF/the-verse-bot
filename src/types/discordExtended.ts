import { Presence, VoiceState } from "discord.js";

export type VoiceStateStamp = { state: VoiceState, timestamp: number };
export type PresenceStamp = { presence: Presence, timestamp: number };