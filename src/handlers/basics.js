import * as Handler from "./../types/handler";
import * as languages from "./../data/languages";

/**
 * A BasicHandler that can handle basic
 * commands and functions. It does not interfere
 * with verse processing nor setting preferences.
 * 
 * @author Elliott Pardee (vypr)
 * @extends Handler
 */
class BasicHandler extends Handler {
	constructor() {
		super("MESSAGE_EVENT");
	}

	/**
	 * Process a command accordingly.
	 * 
	 * @param {string} command The command, without the prefix.
	 * @param {array of strings} args The arguments of the command (optional).
	 * @param {string} lang The language of the user (optional, defaults to "english_us")
	 */
	processCommand(command, args = null, lang = "english_us") {
		if (args) {
			if (!Array.isArray(args)) {
				if (languages.isLanguage(args)) {
					this.processCommand(command, null, args);
				}
			}
		}
	}
}
