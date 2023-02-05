namespace HTTPUtility
{
	export function ToURLParams(obj: { [key: string]: string | number | boolean }): string
	{
		return Object.entries(obj)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			.join('&');
	}
}

export default HTTPUtility;