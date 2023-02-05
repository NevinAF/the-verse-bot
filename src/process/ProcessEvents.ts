import ClientWrapper from "@/ClientWrapper";
import Debug from "@/debug";

async function onexit()
{
	Debug.event("Exiting", "Waiting on exit functions...");
	
	setTimeout(() =>
	{
		Debug.error("Shutdown timed out. Forcing exit.");
		process.exit();
	}, 10000);

	await ClientWrapper.Instance.exit();
	Debug.log("Shutdown complete.");

	process.exit();
}

export default function registerProcessEvents(): void
{
	process.on("uncaughtException", (e) =>
	{
		Debug.critical(e);

		try
		{
			ClientWrapper.Instance.crash();
		}
		catch (exc)
		{
			Debug.error("Failed to run crash routines.", exc);
		}
	});

	//do something when app is closing
	process.on('exit', () => { Debug.log("Exiting...") });

	//catches ctrl+c event
	process.on('SIGINT', onexit);

	// catches "kill pid" (for example: nodemon restart)
	process.on('SIGUSR1', onexit);
	process.on('SIGUSR2', onexit);
}
