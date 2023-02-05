import { AudioReceiveStream, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import prism from "prism-media";
import fs from "fs";
import { ButtonStyle, ChatInputCommandInteraction, ComponentType, Message, VoiceBasedChannel } from "discord.js";
import { Authors, Buttons } from "@/messaging";
import Debug from "@/debug";
import { GoogleDrive } from "@/apis/Google";
import { Lame } from "node-lame";
import { AutoRecordRole } from "@/database/RolesModuleSheet";

const STARTUP_AUDIO_FILE = "public/sound/sound-effects/start-computeraif-14572.mp3";
const TEMP_RECORDING_DIR = "public/temp/recordings/";

const HEADER_SIZE = 44;
const BYTES_PER_SAMPLE = 2;
const CHANNELS = 2;
const SampleRate = 48000;
const FrameSize = 960;
const WRITE_BUFFER_SIZE = 192000 * 2;

const frame_bytes = FrameSize * BYTES_PER_SAMPLE * CHANNELS;
const frame_fill_time = FrameSize / SampleRate;
const buffer_fill_time = WRITE_BUFFER_SIZE / ((FrameSize * CHANNELS * BYTES_PER_SAMPLE) / frame_fill_time) * 1000;

const MAX_RECORDING_TIME = 60 * 60 * 1000 * 2; // 2 hours
const WARNING_TIME = 60 * 1000 * 10; // 10 minutes

interface UserStreamData
{
	userId: string;
	joinTime: number;
	audioStream: AudioReceiveStream;
	opusDecoder: NewType;
	lastChunkTime: number;
	lastEntryOffset: number;
}

interface AudioChunk
{
	data: Buffer;
	timestamp: number;
	user: UserStreamData;
}

type NewType = prism.opus.Decoder;

interface ActivityEntry
{
	userId: string;
	time: number;
	join: boolean;
}

class RecordingSession
{
	public static async CreateSession(interaction: ChatInputCommandInteraction, channel: VoiceBasedChannel)
	{
		if (RecordingSession.GuildHasSession(interaction.guildId))
		{
			return interaction.reply({
				embeds: [{
					author: Authors.Error,
					description: "There is already a recording session in this guild. Please wait for it to finish before starting a new one."
				}], ephemeral: true
			});
		}

		const message = await interaction.reply({ content: "Starting recording session...", fetchReply: true });
		new RecordingSession(interaction.user.id, message, channel, !(interaction.options.getBoolean("record-pauses", false) ?? false));
	}

	public static GuildHasSession(guildId: string)
	{
		for (const session of RecordingSession.Sessions.values())
		{
			if (session.message.guildId === guildId)
			{
				return true;
			}
		}
	}

	public static readonly Sessions: Map<string, RecordingSession> = new Map();

	public readonly creatorId: string;
	public readonly message: Message;
	public readonly channel: VoiceBasedChannel;
	public readonly connection: VoiceConnection;
	public readonly recordingStartTime: number;
	public readonly fileName: string;
	private readonly removePauses: boolean;

	private recordingBuffer: AudioChunk[];
	private users: Map<string, UserStreamData>;
	private activity: ActivityEntry[];
	private disconnectedUsers: string[];

	private fileStream: fs.WriteStream;

	private maxTime: NodeJS.Timeout;

	private constructor(userId: string, message: Message, channel: VoiceBasedChannel, removePauses: boolean)
	{
		this.message = message;
		this.creatorId = userId;
		this.channel = channel;
		this.removePauses = removePauses;

		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: message.guild.id,
			adapterCreator: message.guild.voiceAdapterCreator,
			selfDeaf: false,
			selfMute: false,
		});

		const date = new Date();

		this.recordingStartTime = date.getTime();

		this.recordingBuffer = [];
		this.users = new Map();
		this.activity = [];
		this.disconnectedUsers = [];

		this.fileName = `${TEMP_RECORDING_DIR}${channel.name} ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.wav`;
		this.fileStream = fs.createWriteStream(this.fileName, { start: 44 });

		this.connection.on(VoiceConnectionStatus.Ready, async () =>
		{
			this._joinUser(this.creatorId);

			const [autoRecordRole, _] = await Promise.all([
				AutoRecordRole.fetch(message.guildId),
				channel.fetch(true) // make sure the channel is up to date
			]);

			for await (const [_, member] of channel.members)
			{
				await member.fetch(); // pulls roles if needed
				if (member.roles.cache.has(autoRecordRole))
				{
					this._joinUser(member.id);
				}
			}

			await Promise.all([this.startRecordingSound(), this.updateActiveMessage()]);
		});

		RecordingSession.Sessions.set(this.channel.id, this);

		this.maxTime = setTimeout(() =>
		{
			let atUsers: string[] = [];
			for (const user of this.users.values())
			{
				atUsers.push(`<@${user.userId}>`);
			}

			this.message.channel.send({
				embeds: [{
					author: Authors.Warning,
					description: atUsers.join(" ") +
						"\nThe recording session will reach time limit in 10 minutes."
				}]
			});

			this.maxTime = setTimeout(() =>
			{
				this.maxTime = null;
				this.stopRecording("Recording reached maximum time limit.");
			}, WARNING_TIME);
		}, MAX_RECORDING_TIME - WARNING_TIME);
	}

	public async stopRecording(reason: string)
	{
		if (this.maxTime !== null)
		{
			clearTimeout(this.maxTime);
			this.maxTime = null;
		}

		await this.setUploadingMessage().catch(Debug.error);

		while (this.users.size > 0)
		{
			this.removeUser(this.users.keys().next().value);
		}

		this.connection.destroy();

		const hasAudio = this.flushAudio();
		this.fileStream.end();

		if (!hasAudio)
		{
			return await this.message.edit({embeds: [], content: "No audio was recorded (no users joined or all users were muted)."}).catch(Debug.error);
		}

		this.writeWaveHeader(this.fileName);

		RecordingSession.Sessions.delete(this.channel.id);

		const converted = await this.convertToWav().then(() => true).catch(() => false);
		const filename = converted ? this.fileName.replace(".wav", ".mp3") : this.fileName;
		const filetype = converted ? "mp3" : "wav";

		const file = await GoogleDrive.CreateFile({
			media: {
				mimeType: "audio/" + filetype,
				body: fs.createReadStream(filename),
			},
			fields: "id, name, webViewLink",
			requestBody: {
				name: filename,
				parents: ["12LFjwhev2uWNdYrnYIgRAXtlSkLlsc_2"]
			}
		}).catch(Debug.error);

		if (file)
		{
			await this.setClosedMessage(file.webViewLink, filename).then(() =>
			{
				// delete the file from this file system
				fs.unlink(filename, (err) => { if (err) Debug.error(err); });
				if (converted)
					fs.unlink(this.fileName, (err) => { if (err) Debug.error(err); });
			}).catch(Debug.error);

			
		}
	}

	private _joinUser(userId: string, reconnecting: boolean = false): boolean
	{
		if (this.users.has(userId))
		{
			return false;
		}

		if (reconnecting)
		{
			if (this.disconnectedUsers.includes(userId))
			{
				this.disconnectedUsers.splice(this.disconnectedUsers.indexOf(userId), 1);
			}
			else return false;
		}
		else if (this.disconnectedUsers.includes(userId))
		{
			this.disconnectedUsers.splice(this.disconnectedUsers.indexOf(userId), 1);
		}

		const time = Date.now();
		const userSession: UserStreamData = {
			userId: userId,
			joinTime: time,
			audioStream: this.connection.receiver.subscribe(userId),
			opusDecoder: new prism.opus.Decoder({ rate: SampleRate, channels: CHANNELS, frameSize: FrameSize }),
			lastChunkTime: time,
			lastEntryOffset: 0,
		};
		const activityEntry: ActivityEntry = {
			userId: userId,
			time: time,
			join: true,
		};

		this.users.set(userId, userSession);
		this.activity.push(activityEntry);

		userSession.audioStream.pipe(userSession.opusDecoder).on("data", (chunk: Buffer) =>
		{
			if (chunk.length !== FrameSize * CHANNELS * BYTES_PER_SAMPLE) return;

			let time = Date.now();
			let mintime = 20 + userSession.lastChunkTime;

			if (time < mintime + 20)
			{
				time = mintime;
			}

			this.recordingBuffer.push({
				data: chunk,
				timestamp: time,
				user: userSession,
			});

			userSession.lastChunkTime = time;

			if (this.recordingBuffer.length > 100)
			{
				this.writeAudio();
			}
		});

		return true;
	}

	public async joinUser(user_id: string, reconnecting: boolean = false): Promise<boolean>
	{
		if (this._joinUser(user_id, reconnecting))
		{
			await this.updateActiveMessage();
			return true;
		}
		return false;
	}

	public async leaveUser(user_id: string, disconnected: boolean = false): Promise<boolean>
	{
		Debug.log("leaveUser", user_id, disconnected);

		if (!this.users.has(user_id))
		{
			return false;
		}

		this.removeUser(user_id);

		const time = Date.now();
		const activityEntry: ActivityEntry = {
			userId: user_id,
			time: time,
			join: false,
		};

		this.activity.push(activityEntry);

		if (this.users.size === 0)
		{
			await this.stopRecording("All users left the recording session.");
		}
		else
		{
			await this.updateActiveMessage();

			if (disconnected)
			{
				this.disconnectedUsers.push(user_id);
			}
		}


		return true;
	}

	private removeUser(user_id: string)
	{
		const userSession = this.users.get(user_id);
		userSession.audioStream.destroy();
		userSession.opusDecoder.destroy();
		this.users.delete(user_id);
	}

	private updateActiveMessage()
	{
		return this.message.edit({
			content: "",
			embeds: [{
				author: Authors.Recording,
				description: `Channel: <#${this.channel.id}>\n` +
					"**Activity:**\n" +
					`<@${this.activity[0].userId}> Started <t:${Math.floor(this.recordingStartTime / 1000)}:R>\n` +
					this.activity.slice(1).map((entry) => `<@${entry.userId}> ${entry.join ? "joined" : "left"} <t:${Math.floor(entry.time / 1000)}:R>`).join("\n"),
			}],
			components: Buttons.toNiceActionRows([{
				type: ComponentType.Button,
				label: "Stop Recording",
				style: ButtonStyle.Danger,
				custom_id: "stopRecording",
				emoji: { name: "⬜" }
			}, {
				type: ComponentType.Button,
				label: "Join Recording",
				style: ButtonStyle.Primary,
				custom_id: "joinRecording",
				emoji: { name: "🔊" }
			}, {
				type: ComponentType.Button,
				label: "Leave Recording",
				style: ButtonStyle.Secondary,
				custom_id: "leaveRecording",
				emoji: { name: "🔇" }
			}])
		})
	}

	private setUploadingMessage()
	{
		return this.message.edit({
			content: "Uploading file to Google Drive...",
			embeds: [{
				author: Authors.Recorded,
				title: "Recorded Audio in " + this.channel.name,
				description: "**Activity:**\n" +
					`<@${this.activity[0].userId}> Started <t:${Math.floor(this.recordingStartTime / 1000)}:f>\n` +
					this.activity.slice(1).map((entry) => `<@${entry.userId}> ${entry.join ? "joined" : "left"} <t:${Math.floor(entry.time / 1000)}:T>`).join("\n") +
					`\nUploading (this can take a few seconds)...`
			}],
			components: []
		});
	}

	private async setClosedMessage(link: string, attachFile: string)
	{
		let attach: boolean;

		// Check if the file exists and is smaller than 7.5MB
		try
		{
			const size = fs.statSync(attachFile).size;
			attach = size < 7.5 * 1024 * 1024;
		}
		catch (e)
		{
			attach = false;
		}

		const endTime = Date.now();
		await this.message.edit({
			content: "",
			embeds: [{
				author: Authors.Recorded,
				title: "Recorded Audio in " + this.channel.name,
				description: "**Activity:**\n" +
					`<@${this.activity[0].userId}> Started <t:${Math.floor(this.recordingStartTime / 1000)}:f>\n` +
					this.activity.slice(1).map((entry) => `<@${entry.userId}> ${entry.join ? "joined" : "left"} <t:${Math.floor(entry.time / 1000)}:T>`).join("\n") +
					`\nEnded <t:${Math.floor(endTime / 1000)}:T>`
			}],
			components: Buttons.toNiceActionRows([{
				type: ComponentType.Button,
				label: "View Recording",
				style: ButtonStyle.Link,
				url: link,
				emoji: { name: "📥" }
			}]),
			files: attach ? [attachFile] : []
		});
	}

	private async startRecordingSound()
	{
		const player = createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Pause,
			},
		});

		const audioResource = createAudioResource(STARTUP_AUDIO_FILE);
		player.play(audioResource);

		const subscription = this.connection.subscribe(player);

		setTimeout(() => {
			subscription.unsubscribe();
			player.stop();

			this.connection.setSpeaking(false);
		}, 6000);
	}

	private wavTime: number = null;
	private wavBuffer_one: Buffer = null; // 250 samples or 5s
	private wavBuffer_two: Buffer = null; // 250 samples or 5s

	private nextEmptyBufferIndex: number = null;

	private writeAudio(number_entries: number = -1)
	{
		if (this.recordingBuffer.length === 0) return;

		if (number_entries === -1) number_entries = this.recordingBuffer.length;

		if (this.wavTime === null || this.wavBuffer_one === null || this.wavBuffer_two === null || this.nextEmptyBufferIndex === null)
		{
			this.wavTime = this.recordingBuffer[0].timestamp;
			this.wavBuffer_one = Buffer.alloc(WRITE_BUFFER_SIZE);
			this.wavBuffer_two = Buffer.alloc(WRITE_BUFFER_SIZE);
			this.nextEmptyBufferIndex = 0;
		}
		
		this.recordingBuffer.sort((a, b) => a.timestamp - b.timestamp);

		for (let i = 0; i < number_entries; i++)
		{
			const entry = this.recordingBuffer.shift();
			let entry_offset = Math.floor((entry.timestamp - this.wavTime) / 1000 * SampleRate * CHANNELS) * BYTES_PER_SAMPLE;

			if (entry_offset < 0)
			{
				Debug.warning(`Dropping buffer as it is too old: buffer time: ${entry.timestamp}, wav time: ${this.wavTime}, offset: ${entry_offset}`);
				continue;
			}

			if (Math.abs(entry_offset - (entry.user.lastEntryOffset + (frame_bytes))) < 50)
			{
				entry_offset = entry.user.lastEntryOffset + (frame_bytes);
			}
			entry.user.lastEntryOffset = entry_offset;

			if (this.removePauses)
			{
				if (this.nextEmptyBufferIndex < entry_offset)
				{
					entry_offset = this.nextEmptyBufferIndex;
					this.wavTime = Math.floor(entry.timestamp - (entry_offset / SampleRate / CHANNELS / BYTES_PER_SAMPLE * 1000));
				}
			}

			this.nextEmptyBufferIndex = entry_offset + (frame_bytes); // used when flushing the buffer to remove padding.

			// for each sample in the entry, mix it with the existing samples in the buffer
			for (let j = 0; j < FrameSize * CHANNELS; j++)
			{
				const sample_offset = j * BYTES_PER_SAMPLE;

				const entry_int = entry.data.readInt16LE(sample_offset);

				let buffer_offset = entry_offset + sample_offset;
				let targetBuffer: Buffer;
				
				if (buffer_offset < WRITE_BUFFER_SIZE)
				{
					targetBuffer = this.wavBuffer_one;
				}
				else
				{
					while (buffer_offset >= WRITE_BUFFER_SIZE * 2)
					{
						this.fileStream.write(this.wavBuffer_one);

						this.wavBuffer_one = this.wavBuffer_two;
						this.wavBuffer_two = Buffer.alloc(WRITE_BUFFER_SIZE);
						this.wavTime += buffer_fill_time;

						buffer_offset -= WRITE_BUFFER_SIZE;
						entry_offset -= WRITE_BUFFER_SIZE;
						this.nextEmptyBufferIndex -= WRITE_BUFFER_SIZE;
					}

					targetBuffer = this.wavBuffer_two;
					buffer_offset -= WRITE_BUFFER_SIZE;
				}

				const buffer_int = targetBuffer.readInt16LE(buffer_offset);

				const mixed_int = Math.min(Math.max(entry_int + buffer_int, -32768), 32767);
				targetBuffer.writeInt16LE(mixed_int, buffer_offset);
			}
		}
	}

	private flushAudio(): boolean
	{
		if (this.recordingBuffer.length > 0)
		{
			this.writeAudio();
		}

		if (this.wavBuffer_one === null || this.wavBuffer_two === null) return false;

		
		if (this.nextEmptyBufferIndex <= WRITE_BUFFER_SIZE)
		{
			this.fileStream.write(this.wavBuffer_one.subarray(0, this.nextEmptyBufferIndex));
		}
		else if (this.nextEmptyBufferIndex <= WRITE_BUFFER_SIZE * 2)
		{
			this.fileStream.write(this.wavBuffer_one);
			this.fileStream.write(this.wavBuffer_two.subarray(0, this.nextEmptyBufferIndex - WRITE_BUFFER_SIZE));
		}
		else
		{
			Debug.warning("nextEmptyBufferIndex is out of range: " + this.nextEmptyBufferIndex);

			this.fileStream.write(this.wavBuffer_one);
			this.fileStream.write(this.wavBuffer_two);
		}

		this.wavBuffer_one = null;
		this.wavBuffer_two = null;
		this.wavTime = null;

		return true;
	}

	private writeWaveHeader(filename: string)
	{
		const header = Buffer.alloc(HEADER_SIZE);
		const fileSize = fs.statSync(filename).size;

		if (fileSize < HEADER_SIZE)
		{
			Debug.error("File size is smaller than the header size!");
			return;
		}

		// RIFF header
		header.write("RIFF", 0);
		header.writeUInt32LE(fileSize - 8, 4);
		header.write("WAVE", 8);
		header.write("fmt ", 12);
		header.writeUInt32LE(16, 16); // Subchunk1Size
		header.writeUInt16LE(1, 20); // AudioFormat
		header.writeUInt16LE(CHANNELS, 22); // NumChannels
		header.writeUInt32LE(SampleRate, 24); // SampleRate
		header.writeUInt32LE(SampleRate * CHANNELS * BYTES_PER_SAMPLE, 28); // ByteRate
		header.writeUInt16LE(CHANNELS * BYTES_PER_SAMPLE, 32); // BlockAlign
		header.writeUInt16LE(BYTES_PER_SAMPLE * 8, 34); // BitsPerSample
		header.write("data", 36);
		header.writeUInt32LE(fileSize - HEADER_SIZE, 40);

		fs.open(filename, "r+", (err, fd) =>
		{
			if (err)
			{
				throw err;
			}

			fs.write(fd, header, 0, header.length, 0, (err) =>
			{
				if (err)
				{
					throw err;
				}

				fs.close(fd, (err) =>
				{
					if (err)
					{
						throw err;
					}
				});
			}
			);
		});
	}

	private convertToWav()
	{
		const wav_fileName = this.fileName;
		const mp3_fileName = wav_fileName.replace(".wav", ".mp3");

		const encoder = new Lame({
			// input
			"output": mp3_fileName,
			"bitrate": 64
		}).setFile(wav_fileName);

		return encoder.encode();

	}
}

export default RecordingSession;