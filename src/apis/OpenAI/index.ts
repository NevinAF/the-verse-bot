import { OpenAIApi, Configuration } from "openai";

export namespace OpenAI
{
	const config = new Configuration({
		apiKey: process.env.OPENAI,
	});

	export const api = new OpenAIApi(config);

	export async function getCompletion(prompt: string, userId: string)
	{
		const completion = await api.createCompletion({
			model: "text-davinci-003",
			prompt: prompt,
			max_tokens: 1024,
			n: 1,
			temperature: 0.0,
			user: userId
		});

		return completion.data.choices[0].text;
	}

	export async function getImage(prompt: string, userId: string)
	{
		const completion = await api.createImage({
			prompt: prompt,
			n: 1,
			size: "1024x1024",
			response_format: "b64_json",
			user: userId
		});

		return completion.data.data[0].b64_json;
	}
}