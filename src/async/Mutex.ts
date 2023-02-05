class Mutex
{
	private _locked: boolean = false;
	private _queue: (() => void)[] = [];

	public get locked(): boolean { return this._locked };

	public tryLock(): boolean
	{
		if (this._locked) return false;
		return this._locked = true;
	}

	public lock(): Promise<void>
	{
		return new Promise((resolve) =>
		{
			if (this._locked)
				this._queue.push(resolve);
			else
			{
				this._locked = true;
				resolve();
			}
		});
	}

	public unlock(): void
	{
		if (this._queue.length > 0)
			this._queue.shift()!();
		else
			this._locked = false;
	}
}

export default Mutex;