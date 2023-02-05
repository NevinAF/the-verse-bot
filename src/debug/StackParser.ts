/**
 * Namespace containing utility functions for creating and parsing stack traces into stack frames consisting of file name, line/column number, arguments, and function name.
 */
namespace StackParser
{
	/** Regexp for matching stack trace. */
	const chromeRe = /^\s*at (.*?) ?\(?((?:file|node|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|\/|[a-z]:\\|\\\\).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
	/** Regexp for matching stack trace. */
	const chromeEvalRe = /\((\S*)(?::(\d+))(?::(\d+))\)/;
	
	/** Data container for stack frame data */
	export interface CallEntry
	{
		fileName: string | null;
		methodName: string | null;
		arguments: string[];
		lineNumber: number | null;
		column: number | null;
	}

	/** Parse line for Chrome/NodeJS */
	function parseChrome(line: string): CallEntry | null
	{
		const parts = chromeRe.exec(line);

		if (!parts)
		{
			return null;
		}

		const isNative = parts[2] && parts[2].indexOf('native') === 0; // start of line
		const isEval = parts[2] && parts[2].indexOf('eval') === 0; // start of line

		const submatch = chromeEvalRe.exec(parts[2]);
		if (isEval && submatch != null)
		{
			// throw out eval line/column and use top-most line/column number
			parts[2] = submatch[1]; // url
			parts[3] = submatch[2]; // line
			parts[4] = submatch[3]; // column
		}

		return {
			fileName: !isNative ? parts[2] : null,
			methodName: parts[1] || "file-top",
			arguments: isNative ? [parts[2]] : [],
			lineNumber: parts[3] ? +parts[3] : null,
			column: parts[4] ? +parts[4] : null,
		};
	}

	/**
	 * Returns the function data from a call that is 'index' down from the top of the stack.
	 * Returns null if index is out of bounds or 
	 * @param stack String generated from Error().stack.
	 * @param index Index of call, starting from the top.
	 * @returns Call object with data on the function call.
	 */
	function parseStackIndex(stack: string | undefined, index: number): CallEntry | null
	{
		if (stack)
		{
			const lines = stack.split('\n');

			if (lines[index])
			{
				var parse = parseChrome(lines[index]);

				if (parse)
					return parse;
			}
		}

		return null;
	}

	/**
	 * Returns the function data from call calls in a stack.
	 * @param stack String generated from Error().stack.
	 * @returns Calls with data from the function calls.
	 */
	function parseStack(stack: string | undefined): CallEntry[]
	{
		if (!stack) return [];

		const lines = stack.split('\n');

		var calls: CallEntry[] = [];

		lines.forEach(line =>
		{
			const parseResult = parseChrome(line);

			if (parseResult)
			{
				calls.push(parseResult);
			}
		});

		return calls;
	}

	/**
	 * Creates a new stack trace and parses it, return the function data from the call that is 'index' down from the top of the stack. Index will always exclude the call to this function.
	 * @param callIndex The index of the call to return, starting from the top and excluding the call to this function.
	 * @returns Call entry object with data on the function call. Returns null if index is out of bounds or if the stack trace could not be parsed.
	 */
	export function getCallInfo(callIndex: number): CallEntry | null
	{
		const stack = Error().stack;

		return parseStackIndex(stack, callIndex + 1);
	}

	/**
	 * Creates a new stack trace and parses it, return an array of function data from the calls in the stack. Index will always exclude the call to this function.
	 * @returns Array of call entry objects with data on the function calls.
	 */
	export function getStackInfo(): CallEntry[]
	{
		const stack = Error().stack;

		return parseStack(stack);
	}
}

export default StackParser;