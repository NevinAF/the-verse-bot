console.log("       bot:1:1    $ Creating path aliases...");
import "./paths";

console.log("       bot:5:1    $ Loading debug functions...");
import Debug from "@/debug";


Debug.log("Loading environment variables...");
import * as dotenv from "dotenv";
dotenv.config();

Debug.log("Overriding process handlers...");
import registerProcessEvents from "@/process";
registerProcessEvents();

Debug.log("Creating client wrapper...");
import ClientWrapper from "@/ClientWrapper";
new ClientWrapper(process.env.DISCORD_TOKEN ?? "");

Debug.log("Loading API scripts...");
import initApis from "@/apis";

Debug.log("Initializing database sheets...");
import database from "./database";
ClientWrapper.Instance.registerModuleSheets(database);

Debug.log("Initializing modules...");
import logging from "@/modules/logging";
import core from "@/modules/core";
import polls from "@/modules/polls";
import events from "@/modules/events";
import presence from "@/modules/presence";
import statistics from "./modules/statistics";
import shoutouts from "./modules/shoutouts";
import recording from "./modules/recording";
import roleAssign from "./modules/role-assign";

Debug.log("Registering modules...");
for (const module of [
	...logging,
	...core,
	...polls,
	...events,
	...presence,
	...statistics,
	...shoutouts,
	...recording,
	...roleAssign
]) {
	ClientWrapper.Instance.registerModule(module);
}

const hostname = 'localhost';
const port = 3000;

(async () =>
{
	Debug.log("Connecting to APIs...");
	await initApis();

	Debug.log("Starting client...");
	await ClientWrapper.Instance.start();

	Debug.banner("BgGreen", "Client Started!.");

	Debug.log("Loading next js...");
	const { createServer } = require("http");
	const { parse } = require('url');
	const next = require("next");
	const app = next({ dev: process.env.NODE_ENV !== "production" });
	const handle = app.getRequestHandler();

	app.prepare().then(() =>
	{
		createServer(async (req, res) => {
			try {
				// Be sure to pass `true` as the second argument to `url.parse`.
				// This tells it to parse the query portion of the URL.
				const parsedUrl = parse(req.url, true)
				const { pathname, query } = parsedUrl
		
				if (pathname === '/a')
				{
					await app.render(req, res, '/a', query)
				} else if (pathname === '/b')
				{
					await app.render(req, res, '/b', query)
				} else
				{
					await handle(req, res, parsedUrl)
				}
			} catch (err) {
				console.error('Error occurred handling', req.url, err)
				res.statusCode = 500
				res.end('internal server error')
			}
		}).listen(port, (err) => {
			if (err) throw err
			console.log(`> Ready on http://${hostname}:${port}`)
		})
	}
	);
})();