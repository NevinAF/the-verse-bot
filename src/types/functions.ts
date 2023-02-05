import { Awaitable } from "discord.js";

/**
 * An awaitable function that takes in specific arguments and returns a value.
 * @template T An array of arguments to pass to the function.
 * @template V The return type of the function. Defaults to void.
 */
export type Delegate<T extends unknown[] = [], V = any> = (...agr: T) => Awaitable<V>;

/**
 * A value that can be represented as the result of a function. Useful for defining a type that is sometimes constant and sometimes updatable by a function.
 * @template T The type of the function that returns the value.
 * @template A If the value is a function, the arguments to pass to the function. Defaults to an empty array.
 */
export type FuncAble<T extends object | string | number | boolean, A extends unknown[]> = T | Delegate<A, T>;