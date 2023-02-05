import { BotModule } from "@/types";
import RecordChatCommand from "./RecordChatCommand";
import JoinRecordingButton from "./JoinRecordingButton";
import LeaveRecordingButton from "./LeaveRecordingButton";
import StopRecordingButton from "./StopRecordingButton";
import BackgroundJamChatCommand from "./BackgroundJamChatCommand";
import RecordingVoiceChannelStateCallbacks from "./RecordingVoiceChannelStateCallbacks";
import SuggestRecording from "./SuggestRecording";
import StartRecordingButton from "./StartRecordingButton";

export default [

	RecordChatCommand,
	JoinRecordingButton,
	LeaveRecordingButton,
	StopRecordingButton,
	BackgroundJamChatCommand,
	RecordingVoiceChannelStateCallbacks,
	SuggestRecording,

] as BotModule[];