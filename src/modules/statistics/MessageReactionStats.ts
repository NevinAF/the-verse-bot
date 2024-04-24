import { UserData, UserEntryData } from "@/database/UserDataModuleSheet";
import { BotModule } from "@/types";
import { MessageReaction, PartialMessageReaction, User, PartialUser, Message, PartialMessage, Collection } from "discord.js";

function addedReaction(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser)
{
	if (!reaction.message.guildId)
		return;
	
	if (reaction.message.author && reaction.message.author.id === user.id)
		return;
	
	const promises: Promise<any>[] = [];

	promises.push(
		UserData.incrementCell(reaction.message.guildId, {
			column: UserEntryData.UserID,
			compareValue: user.id
		}, UserEntryData.MessageReactionsAdded)
	);

	if (reaction.message.author)
	{
		promises.push(
			UserData.incrementCell(reaction.message.guildId, {
				column: UserEntryData.UserID,
				compareValue: reaction.message.author.id
			}, UserEntryData.MessageReactionsGotten)
		);


	}

	// if message was created less than 15 minutes ago
	if (reaction.message.createdTimestamp >= Date.now() - 15 * 60 * 1000)
	{
		promises.push(
			UserData.incrementCell(reaction.message.guildId, {
				column: UserEntryData.UserID,
				compareValue: user.id
			}, UserEntryData.FastMessageReactions)
		);
	}

	return Promise.all(promises);
}

function removedRection(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser)
{
	if (!reaction.message.guildId)
		return;
	
	if (reaction.message.author && reaction.message.author.id === user.id)
		return;
	
	return UserData.incrementCell(reaction.message.guildId, {
		column: UserEntryData.UserID,
		compareValue: user.id
	}, UserEntryData.MessageReactionsRemoved);
}

function allReactionsRemoved(message: Message<boolean> | PartialMessage, reactions: Collection<string, MessageReaction>)
{
}

function allOfEmojiRemoved(reaction: MessageReaction | PartialMessageReaction)
{
}

/**
 * Module for recording the data from message reactions
 */
export default {

	registerMessageReactionAdd: [addedReaction],
	registerMessageReactionRemove: [removedRection],
	registerMessageReactionRemoveAll: [allReactionsRemoved],
	registerMessageReactionRemoveEmoji: [allOfEmojiRemoved],

} as BotModule;



