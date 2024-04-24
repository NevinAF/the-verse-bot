import { GoogleClient } from "./Google";

export * from "./Google";
export * from "./Dezzer";
export * from "./OpenAI";

export default function initialized()
{
	return Promise.all([
		GoogleClient.initialize()
	]);
};