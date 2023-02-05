import Debug from "@/debug";
import { Delegate, FuncAble } from "@/types";
import { Awaitable } from "discord.js";

namespace Resolvers
{
	export async function safelyInvokeDelegate<T extends unknown[]>(callback: Delegate<T>, ...arg: T)
	{
		try
		{
			await callback(...arg);
		}
		catch (e)
		{
			Debug.error(e);
		}
	}

	export function resolveFuncAble<T extends object | string | number | boolean, A extends unknown[]>(data: FuncAble<T, A>, ...args: A): Awaitable<T>
	{
		if (typeof data == "function")
		{
			return data(...args);
		}
		else return data;
	}
}

export default Resolvers;