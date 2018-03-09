import Handler from "../types/handler";
import * as commandBridge from "./commands/commandBridge";
import config from "../data/config";

const commandMap = {
    "versions": 0,
    "setversion": 1,
    "version": 0,
    "versioninfo": 1,
    "random": 0,
    "verseoftheday": 0,
    "votd": 0,
    "headings": 1,
    "versenumbers": 1,
    "languages": 0,
    "setlanguage": 1,
    "language": 0,
    "allusers": 1,
    "users": 1,
    "servers": 1,
    "invite": 0,

    "jepekula": 0,
    "joseph": 0,
    "supporters": 0,

    "addversion": 5,
    "av": 5
};

/**
 * Verify whether a command actually exists,
 * according to the translation.
 * 
 * @author Elliott Pardee (vypr)
 * 
 * @param {string} command The command that the user is trying to attempt.
 * @param {string} lang The language of the user.
 */
function isCommand(command, lang) {
    const commands = lang.commands;

    let result = {
        ok: false
    };

    // eval is not in the language files, as it's just a wrapper
    if (command == "eval") {
        result = {
            ok: true,
            orig: "eval"
        };
    } else if (command == "jepekula") {
        result = {
            ok: true,
            orig: "jepekula"
        };
    } else if (command == "joseph") {
        result = {
            ok: true,
            orig: "joseph"
        };
    } else if (command == "supporters") {
        result = {
            ok: true,
            orig: "supporters"
        };
    } else {
        Object.keys(commands).forEach((originalCommandName) => {
            if (commands[originalCommandName] == command) {
                result = {
                    ok: true,
                    orig: originalCommandName
                };
            }
        });
    }

    return result;
}

function isOwnerCommand(command, lang) {
    const commands = lang.commands;

    switch (command) {
        case commands.puppet:
            return true;
        case commands.announce:
            return true;
        case "eval":
            return true;
    }

    return false;
}

/**
 * A CommandHandler that can handle basic
 * commands and functions. It does not interfere
 * with verse processing.
 * 
 * @author Elliott Pardee (vypr)
 * @extends Handler
 */
export default class CommandHandler extends Handler {
    constructor() {
        super("COMMAND_EVENT");
    }

    /**
     * Process a command accordingly.
     * 
     * @param {string} command The command, without the prefix.
     * @param {array of strings} args The arguments of the command (optional).
     * @param {language object} lang The language of the user.
     * @param {user object} sender The sender of the command.
     * @param {function} callback The callback.
     */
    processCommand(bot, command, args = null, lang, sender, callback) {
        if (!Array.isArray(args)) {
            this.processCommand(command, null, lang);
        }

        const rawLanguage = lang.getRawObject();
        const commands = rawLanguage.commands;
        const properCommand = isCommand(command, rawLanguage);

        if (properCommand.ok) {
            if (!isOwnerCommand(properCommand.orig, rawLanguage)) {
                if (properCommand.orig != commands.headings && properCommand.orig != commands.versenumbers) {
                    if (properCommand.orig != commands.servers && properCommand.orig != commands.allusers && properCommand.orig != commands.users) {
                    const requiredArguments = commandMap[properCommand.orig];

                        // let's avoid a TypeError!
                        if (args == null) {
                            args = {
                                length: 0
                            };
                        }

                        if (args.length != requiredArguments) {
                            const response = rawLanguage.argumentCountError
                                .replace("<command>", command)
                                .replace("<count>", requiredArguments);

                            throw new Error(response);
                        }

                        commandBridge.runCommand(properCommand.orig, args, rawLanguage, sender, (result) => {
                            return callback(result);
                        });
                    } else {
                        commandBridge.runCommand(properCommand.orig, [ bot ], rawLanguage, sender, (result) => {
                            return callback(result);
                        });
                    }
                } else {
                    // headings/versenumbers can take 1 or no argument
                }
            } else {
                try {
                    if (sender.id == config.owner) {
                        commandBridge.runOwnerCommand(command, args, (result) => {
                            return callback(result);
                        });
                    }
                } catch (e) {
                    const response = rawLanguage.commandNotFoundError.replace("<command>", command);
                    throw new Error(response);
                }
            }
        } else {
            const response = rawLanguage.commandNotFoundError.replace("<command>", command);
            throw new Error(response);
        }
    }
}
