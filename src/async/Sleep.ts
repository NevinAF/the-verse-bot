namespace Sleep
{
	/**
	 * Sleeps for the specified amount of time.
	 * @param ms Time to sleep in milliseconds.
	 * @returns Promise that resolves after the specified amount of time.
	 */
	export function sleep(ms: number): Promise<void>
	{
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Sleeps until the condition is met.
	 * @param condition Condition to wait for.
	 * @param interval Interval to check the condition at.
	 * @returns Promise that resolves when the condition is met.
	 */
	export function sleepUntil(condition: () => boolean, interval: number = 100): Promise<void>
	{
		return new Promise((resolve) =>
		{
			if (condition())
			{
				resolve();
				return;
			}
			const intervalId = setInterval(() =>
			{
				if (condition())
				{
					clearInterval(intervalId);
					resolve();
				}
			}, interval);
		});
	}

	/**
	 * Sleeps until the condition is no longer met.
	 * @param condition Condition to hold for.
	 * @param interval Interval to check the condition at.
	 * @returns Promise that resolves when the condition is no longer met.
	 */
	export function sleepWhile(condition: () => boolean, interval: number = 100): Promise<void>
	{
		return sleepUntil(() => !condition(), interval);
	}
}

export default Sleep;