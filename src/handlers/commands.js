const Handler = require("./../types/handler");
const commandBridge = require("./commands/commandBridge");
const config = require("../data/config");

const Discord = require("discord.js");

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
    "users": 0,
    "servers": 0,
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
module.exports = class CommandHandler extends Handler {
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
                        if (properCommand.orig !== commands.servers && properCommand.orig !== commands.users) {
                            const requiredArguments = commandMap[properCommand.orig];

                            // let's avoid a TypeError!
                            if (args === null) {
                                args = {
                                    length: 0,
                                };
                            }

                            if (args.length !== requiredArguments) {
                                const embed = new Discord.RichEmbed();
                                embed.setColor("#ff2e2e");
                                embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                                const response = rawLanguage.argumentCountError
                                    .replace("<command>", command)
                                    .replace("<count>", requiredArguments);

                                embed.addField(rawLanguage.error, response);

                                return callback({ isError: true, return: embed });
                            }

                            commandBridge.runCommand(properCommand.orig, args, rawLanguage, sender, (result) => {
                                callback(result);
                            });
                        } else {
                            const requiredArguments = commandMap[properCommand.orig];

                            // let's avoid a TypeError!
                            if (args === null) {
                                args = {
                                    length: 0,
                                };
                            }

                            if (args.length !== requiredArguments) {
                                const embed = new Discord.RichEmbed();
                                embed.setColor("#ff2e2e");
                                embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                                const response = rawLanguage.argumentCountError
                                    .replace("<command>", command)
                                    .replace("<count>", requiredArguments);

                                embed.addField(rawLanguage.error, response);

                                return callback({ isError: true, return: embed });
                            }

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
                            const embed = new Discord.RichEmbed();
                            embed.setColor("#ff2e2e");
                            embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                            const response = rawLanguage.argumentCountError
                                .replace("<command>", command)
                                .replace("<count>", rawLanguage.zeroOrOne);

                            embed.addField(rawLanguage.error, response);

                            return callback({ isError: true, return: embed });
                        }
                    }
                } else {
                    if (args === null) {
                        args = {
                            length: 0,
                        };
                    }

                    if (args.length === 1 && args[0].length < 4) {
                        const embed = new Discord.RichEmbed();
                        embed.setColor("#ff2e2e");
                        embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                        embed.addField(rawLanguage.error, rawLanguage.queryTooShort);

                        return callback({ isError: true, return: embed });
                    }

                    if (args.length === 0) {
                        const embed = new Discord.RichEmbed();
                        embed.setColor("#ff2e2e");
                        embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                        const response = rawLanguage.argumentCountErrorAL
                            .replace("<command>", command)
                            .replace("<count>", 1);

                        embed.addField(rawLanguage.error, response);

                        return callback({ isError: true, return: embed });
                    } else {
                        commandBridge.runCommand(properCommand.orig, args, rawLanguage, sender, (result) => {
                            callback(result);
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
                    const embed = new Discord.RichEmbed();
                    embed.setColor("#ff2e2e");
                    embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                    const response = rawLanguage.commandNotFoundError.replace("<command>", command);

                    embed.addField(rawLanguage.error, response);

                    return callback({ isError: true, return: embed });
                }
            }
        } else {
            const embed = new Discord.RichEmbed();
            embed.setColor("#ff2e2e");
            embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

            const response = rawLanguage.commandNotFoundError.replace("<command>", command);

            embed.addField(rawLanguage.error, response);

            return callback({ isError: true, return: embed });
        }
    }
};
