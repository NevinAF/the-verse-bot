import Authors from "./Authors";

const QuickReplies = {
	interactionNeedsGuild: {
		embeds: [{
			author: Authors.Error,
			description: "This command can only be used in a guild!"
		}], ephemeral: true
	},
	interactionError: (error: string) => ({
		embeds: [{
			author: Authors.Error,
			description: error
		}], ephemeral: true
	}),
	
};

export default QuickReplies;
