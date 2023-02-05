namespace Emojis
{
	export const thumbsUp = "👍";
	export const thumbsDown = "👎";
	export const heart = "❤️";
	export const heartBroken = "💔";
	export const heartEyes = "😍";

	export const numbers = number => (number < 10 && number >= 0) ? ([
		"1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"
	])[number] : "0️⃣";
}

export default Emojis;