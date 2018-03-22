import Handler from "../types/handler";
import * as commandBridge from "./commands/commandBridge";
import config from "../data/config";

import { RichEmbed } from "discord.js";

const commandMap = {
    "biblebot": 0,
    "search": 1,
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

    "addversion": 5
};

/**
 * Verify whether a command actually exists,
 * according to the translation.
 * 
 * @author Elliott Pardee (vypr)
 * 
 * @param {string} command The command that the user is trying to attempt.
 * @param {string} lang The language of the user.
 * @returns {object} { ok: boolean, orig: string }
 */
function isCommand(command, lang) {
    const commands = lang.commands;

    let result = {
        ok: false,
    };

    // eval is not in the language files, as it's just a wrapper
    if (command === "eval") {
        result = {
            ok: true,
            orig: "eval",
        };
    } else if (command === "jepekula") {
        result = {
            ok: true,
            orig: "jepekula",
        };
    } else if (command === "joseph") {
        result = {
            ok: true,
            orig: "joseph",
        };
    } else if (command === "supporters") {
        result = {
            ok: true,
            orig: "supporters",
        };
    } else {
        Object.keys(commands).forEach((originalCommandName) => {
            if (commands[originalCommandName] === command) {
                result = {
                    ok: true,
                    orig: originalCommandName,
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
        case commands.addversion:
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
     * Processes a user command.
     * 
     * @param {object} bot The bot object.
     * @param {string} command The command.
     * @param {array} args The arguments of the command.
     * @param {object} lang The language object.
     * @param {object} sender The user object of who sent the message.
     * @param {function} callback The callback.
     * @returns {callback} A callback.
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
                if (properCommand.orig !== commands.search) {
                    if (properCommand.orig !== commands.headings && properCommand.orig !== commands.versenumbers) {
                        if (properCommand.orig !== commands.servers && properCommand.orig !== commands.allusers && properCommand.orig !== commands.users) {
                            const requiredArguments = commandMap[properCommand.orig];

                            // let's avoid a TypeError!
                            if (args === null) {
                                args = {
                                    length: 0,
                                };
                            }

                            if (args.length !== requiredArguments) {
                                const response = rawLanguage.argumentCountError
                                    .replace("<command>", command)
                                    .replace("<count>", requiredArguments);

                                throw new Error(response);
                            }

                            commandBridge.runCommand(properCommand.orig, args, rawLanguage, sender, (result) => {
                                callback(result);
                            });
                        } else {
                            commandBridge.runCommand(properCommand.orig, [bot], rawLanguage, sender, (result) => {
                                callback(result);
                            });
                        }
                    } else {
                        // headings/versenumbers can take 1 or no argument
                        // let's avoid a TypeError!
                        if (args === null) {
                            args = {
                                length: 0,
                            };
                        }

                        if (args.length === 0 || args.length === 1) {
                            commandBridge.runCommand(properCommand.orig, args, rawLanguage, sender, (result) => {
                                callback(result);
                            });
                        } else {
                            const response = rawLanguage.argumentCountError
                                .replace("<command>", command)
                                .replace("<count>", rawLanguage.zeroOrOne);

                            throw new Error(response);
                        }
                    }
                } else {
                    if (args === null) {
                        args = {
                            length: 0,
                        };
                    }

                    if (args.length === 1 && args[0].length < 4) {
                        throw new Error(rawLanguage.queryTooShort);
                    }

                    if (args.length === 0) {
                        const response = rawLanguage.argumentCountErrorAL
                            .replace("<command>", command)
                            .replace("<count>", 1);

                        throw new Error(response);
                    } else {
                        commandBridge.runCommand(properCommand.orig, args, rawLanguage, sender, (result) => {
                            let query = "";

                            for (const index in args) {
                                query += args[index] + " ";
                            }

                            const pages = [];
                            let totalPages = Math.ceil(Object.keys(result).length / 5);

                            if (totalPages === 0) {
                                totalPages++;
                            }

                            for (let i = 0; i < totalPages; i++) {
                                const embed = new RichEmbed();

                                embed.setTitle(rawLanguage.searchResults + " \"" + query.slice(0, -1) + "\"");
                                embed.setDescription(rawLanguage.page + " " + (pages.length + 1) + " " + rawLanguage.of + " " + totalPages);
                                embed.setColor(303102);
                                embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                                if (Object.keys(result).length > 0) {
                                    let count = 0;
                                    Object.keys(result).forEach((key) => {
                                        if (count < 5) {
                                            embed.addField(result[key].title, result[key].text, true);
                                            delete result[key];
                                            count++;
                                        }
                                    });
                                } else {
                                    embed.setTitle(rawLanguage.nothingFound.replace("<query>", query.slice(0, -1)));
                                }

                                pages.push(embed);
                            }

                            if (pages.length > 1) {
                                return callback({ level: "info", paged: true, pages: pages });
                            } else {
                                return callback({ level: "err", message: pages[0] });
                            }
                        });
                    }
                }
            } else {
                try {
                    if (sender.id === config.owner) {
                        commandBridge.runOwnerCommand(command, args, rawLanguage, (result) => {
                            callback(result);
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
