import path from "path";
import StackParser from "./StackParser";

/**
 * Returns the function data from a call that is 'index' down from the top of the stack.
 */
class Debug
{
	private static _logOutput: string = "";
	public static get logOutput(): string { return this._logOutput; }

	public static readonly logLength: number = 1000;

	public static readonly Colors = {
		Reset: "\x1b[0m",
		Bright: "\x1b[1m",
		Dim: "\x1b[2m",
		Underscore: "\x1b[4m",
		Blink: "\x1b[5m",
		Reverse: "\x1b[7m",
		Hidden: "\x1b[8m",

		FgBlack: "\x1b[30m",
		FgRed: "\x1b[31m",
		FgGreen: "\x1b[32m",
		FgYellow: "\x1b[33m",
		FgBlue: "\x1b[34m",
		FgMagenta: "\x1b[35m",
		FgCyan: "\x1b[36m",
		FgWhite: "\x1b[37m",

		BgBlack: "\x1b[40m",
		BgRed: "\x1b[41m",
		BgGreen: "\x1b[42m",
		BgYellow: "\x1b[43m",
		BgBlue: "\x1b[44m",
		BgMagenta: "\x1b[45m",
		BgCyan: "\x1b[46m",
		BgWhite: "\x1b[47m",
	}

	/**
	 * Returns a string that is colored based on the input string (when output to the console).
	 * @param color The color to use. Must be a key in the LoggingUtils.Colors object.
	 * @param str The string to color.
	 * @returns The colored string.
	 */
	public static color<T extends keyof typeof Debug.Colors>(color: T, str: string): string
	{
		return `${Debug.Colors[color]}${str}${Debug.Colors.Reset}`;
	}

	/**
	 * Returns a string that when output to the console will be displayed as a banner using "***" as the border.
	 * @param color The color to use. Must be a key in the LoggingUtils.Colors object.
	 * @param title The title to display in the banner.
	 * @param content The content to display in the banner.
	 * @returns The banner string.
	 */
	public static createBanner<T extends keyof typeof Debug.Colors>(color: T, title: string, ...content: any[]): string
	{
		if (title.length > 42)
			title.substring(0, 42);

		title = "  " + title + "  ";
		title = title.padEnd(title.length + Math.ceil((46 - title.length) / 2)).padStart(46);
		title = "/*" + title + "*/";

		var middle = "";
		if (content.length > 0)
			middle = Debug.toStrings(content).join("\n");

		return Debug.color(color, "/************************************************/") + "\n" +
			Debug.color(color, title) + "\n" +
			(middle.length > 0 ? (middle + "\n") : "") +
			Debug.color(color, "/************************************************/");
	}

	/**
	 * Returns all of the arguments as strings. This is useful for logging objects and errors.
	 * @param args The arguments to convert to strings.
	 * @returns The arguments as strings.
	 */
	private static toStrings(args: any[]): string[]
	{
		var out: string[] = [];
		
		for (let i = 0; i < args.length; i++)
		{
			if (!args[i])
				out.push("null");

			else if (typeof args[i].stack === 'string' &&
					typeof args[i].name === 'string' &&
					typeof args[i].message === 'string')
			{
				out.push(Debug.color("FgRed", args[i].name) + ": " +	Debug.color("FgRed", args[i].message) + "\n" + args[i].stack.substring(args[i].stack.indexOf("\n") + 1));
			}
			else if (args[i].toString === Object.prototype.toString)
			{
				const str = JSON.stringify(args[i], null, 1);
				out.push(str.substring(1, str.length - 1));
			} else
			{
				out.push(args[i].toString());
			}
		}

		return out;
	}

	/**
	 * Creates a fancy printout of the calling function.
	 * @param fileName The name of the file that the calling function is in.
	 * @param lineNumber The line number of the calling function.
	 * @param column The column number of the calling function.
	 * @returns string representing the fancy printout.
	 */
	private static getCallerPrefix(fileName: string | null, lineNumber: number | null, column: number | null): string
	{
		const file: string = fileName ? path.basename(fileName, path.extname(fileName)) : "unknown";
		const line: string = lineNumber?.toString() ?? "N/A";
		const col: string = column?.toString() ?? "N/A";

		var result: string = "";

		result += "" + Debug.color("FgCyan", file.padStart(10).substring(0,10)) + ":";
		result += Debug.color("FgYellow", line) + ":";
		if (col.length > 6 - line.length)
			for (let i = 0; i < 6 - line.length; i++)
				result += "x";
		else result += Debug.color("FgYellow", col.padEnd(6 - line.length).substring(0, 6 - line.length));

		return result + "$ ";
	}

	private static _print(args: any[], stackTrace: boolean = false)
	{
		const callInfo: StackParser.CallEntry = StackParser.getCallInfo(3); // 0 = _print, 1 = log wrapper, 2 = caller
		const prefix: string = Debug.getCallerPrefix(callInfo.fileName, callInfo.lineNumber, callInfo.column);

		const message = Debug.toStrings(args).join(" ");

		console.log(prefix + message);

		// remove all styling from the message
		const strippedMessage = (prefix + message).replace(/\x1b\[[0-9;]*m/g, "");
		Debug._logOutput += strippedMessage + "\n";

		if (stackTrace)
		{
			const stack = Error().stack;
			var append = stack?.substring(stack?.indexOf("\n    ") ?? 0) + "\n";
			console.log(append);
			Debug._logOutput += append;
		}

		let trimto = Debug._logOutput.length - Debug.logLength;
		while (trimto > 0 && Debug._logOutput[trimto] !== "\n")
			trimto--;
		
		Debug._logOutput = Debug._logOutput.substring(trimto);
	}

	/** Prints a log to the consol, prepending 20 characters for tracing the source function/file/line */
	public static log(...args: any[])
	{
		Debug._print(args);
	}

	/** Prints a log to the consol, prepending 20 characters for tracing the source function/file/line and appending a stack trace */
	public static trace(...args: any[])
	{
		Debug._print(args, true);
	}

	/** Prints a log to the consol, with a colored "" tag for easier identification */
	public static event(title: string, ...args: any[])
	{
		Debug._print([Debug.color("FgGreen", "< " + title.padStart(7, " ").substring(0, 7) + " >"), ...args]);
	}

	/** Prints a log to the consol, with a colored "Error" tag for easier identification. This will also append a stack trace. */
	public static error(...args: any[])
	{
		Debug._print([Debug.color("FgRed", "!! Error !!"), ...args], true);
	}

	/** Prints a log to the consol, with a colored "Warn" tag for easier identification */
	public static warning(...args: any[])
	{
		Debug._print([Debug.color("FgYellow", "<#  Warn #>"), ...args]);
	}

	/** Prints a log to the consol, with a colored "Info" tag for easier identification */
	public static info(...args: any[])
	{
		Debug._print([Debug.color("FgCyan", "<<  Info >>"), ...args]);
	}

	/** Prints a log to the consol, taking up 4+ lines: one separators, then a title, then the content of the log, then another separator. */
	public static banner(color: keyof typeof Debug.Colors, title: string, ...content: any[])
	{
		Debug._print(["\n" + Debug.createBanner(color, title, ...content)]);
	}
	
	/** Prints a critical error to the consol using a banner and outputs a stack trace. */
	public static critical(...args: any[])
	{
		Debug._print([
			"\n" + Debug.banner(
				"BgRed",
				"Critical Error",
				"A critical error has occurred, this is likely to cause the program to crash or the bot to stop responding. See below for more information.",
				...args)
		], true);
	}

	public static assert(condition: boolean, ...args: any[])
	{
		if (!condition)
		{
			Debug.error(...args);
			throw new Error("Assertion failed");
		}
	}
}

export default Debug;