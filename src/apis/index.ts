import { GoogleClient } from "./Google";

export * from "./Google";

export default function initialized()
{
	return Promise.all([
		GoogleClient.initialize()
	]);
};