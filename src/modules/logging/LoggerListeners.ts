import ClientWrapper from "@/ClientWrapper";
import Debug from "@/debug";
import { Previewing } from "@/messaging";
import { BotModule } from "@/types";

Debug.log("Logging module loaded.");

/**
 * Default listeners that log events to the console.
 */
export default {

onReady: [() =>
{
	Debug.assert(ClientWrapper.Client?.user?.tag != null, "Client/user/tag is null on ready!");
	Debug.event(" Ready ", `Logged in as ${ClientWrapper.Client.user?.tag}!`);
}],

onMessageCreate: [(message) =>
{
	if (message.author.bot) return;

	return message.fetch()
		.then(message => Debug.event("New Msg", `Received message ${Previewing.previewMessage(message)}`))
		.catch(() => Debug.event("New Msg", `Message no longer exists or cannot be accessed!`));
}],

onMessageDelete: [async (message) =>
{
	if (!message.author || message.author.bot) return;

	return message.fetch()
		.then(message => Debug.event("Del Msg", `Deleted message ${Previewing.previewMessage(message)}`))
		.catch(() => Debug.event("Del Msg", `Message no longer exists or cannot be accessed!`));
}],

onMessageUpdate: [async (oldMessage, newMessage) =>
{
	if (!oldMessage.author || oldMessage.author.bot || !newMessage.author || newMessage.author.bot) return;

	return oldMessage.fetch()
		.then(oldMessage => newMessage.fetch()
			.then(newMessage => Debug.event("Edit Msg", `Edited message ${Previewing.previewMessage(oldMessage)} to ${Previewing.previewMessage(newMessage)}`))
			.catch(() => Debug.event("Edit Msg", `New message no longer exists or cannot be accessed!`)))
		.catch(() => Debug.event("Edit Msg", `Old message no longer exists or cannot be accessed!`));
}],

onInteractionCreate: [(i) =>
{
	if (i.isUserContextMenuCommand())
		Debug.event("UserCmd", `${i.user.tag}, cmd: ${i.commandName}, user: ${i.targetUser.tag}`);
	else if (i.isMessageContextMenuCommand())
		Debug.event("Msg Cmd", `${i.user.tag}, cmd: ${i.commandName}, msg: ${Previewing.previewMessage(i.targetMessage)}`);
	else if (i.isCommand())
		Debug.event("ChatCmd", `${i.user.tag}, cmd: ${i.commandName}`);
	else if (i.isButton())
		Debug.event("Button", `${i.user.tag}, btnId: ${i.customId}, label: ${i.component.label}`)
	else if (i.isModalSubmit())
		Debug.event(" Modal ", `${i.user.tag}, modId: ${i.customId}`)
	else
		Debug.event("Unknown", `${i.user.tag}`)
}]

} as BotModule;