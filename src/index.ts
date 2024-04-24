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
import statistics from "@/modules/statistics";
import shoutouts from "@/modules/shoutouts";
import recording from "@/modules/recording";
import roleAssign from "@/modules/role-assign";
import versebotResponses from "@/modules/versebot-responses";
import serverUpdates from "./modules/server-updates";

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
	...roleAssign,
	...versebotResponses,
	...serverUpdates,
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
})();