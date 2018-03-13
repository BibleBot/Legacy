import central from "./central";
import config from "./data/config";

import * as Discord from "discord.js";
const bot = new Discord.Client();

import CommandHandler from "./handlers/commands";
import VerseHandler from "./handlers/verses";

const commandHandler = new CommandHandler();
const verseHandler = new VerseHandler();

import settings from "./handlers/commands/settings";

let shard;
const totalShards = config.shards;

bot.on("ready", () => {
    shard = bot.shard.id + 1;

    central.logMessage("info", shard, "global", "global", "connected");

    bot.user.setPresence({
        status: "online",
        game: {
            type: 0,
            name: "BibleBot v" + process.env.npm_package_version + " | Shard: " +
                shard + " / " + totalShards,
            url: "https://biblebot.vypr.space"
        }
    });
});

bot.on("debug", (debug) => {
    if (config.debug) {
        central.logMessage("debug", (bot.shard.id + 1), "global", "global", debug);
    }
});

bot.on("reconnecting", () => {
    central.logMessage("info", shard, "global", "global", "attempting to reconnect");
});

bot.on("disconnect", () => {
    central.logMessage("info", shard, "global", "global", "disconnected");
});

bot.on("warning", (warn) => {
    central.logMessage("warn", shard, "global", "global", warn);
});

bot.on("error", (e) => {
    central.logMessage("err", shard, "global", "global", e);
});

bot.on("message", (raw) => {
    // taking the raw message object and making it more usable
    let rawSender = raw.author;
    let sender = rawSender.username + "#" + rawSender.discriminator;
    let channel = raw.channel;
    let message = raw.content;
    let source;

    if (config.debug) {
        // TODO: Replace this with user IDs.
        switch (sender) {
            case "vipr#4035":
                break;
            default:
                if (config.versionAdders.indexOf(sender) !== -1) {
                    break;
                } else {
                    return;
                }
        }
    }

    settings.languages.getLanguage(rawSender, (language) => {
        // channel.guild is used here because
        // of the possibility that DMs are being used
        // otherwise, i'd use guild.name
        if ((typeof channel.guild !== "undefined") &&
            (typeof channel.name !== "undefined")) {
            source = channel.guild.name + "#" + channel.name;
        } else {
            source = "unknown (direct messages?)";
        }

        if (sender === config.botname) {
            return;
        }
        if (channel.guild.name.includes("Discord Bot")) {
            if (raw.author.id !== config.owner) {
                return;
            }
        }

        if (message.charAt(0) === "+") {
            const command = message.substr(1).split(" ")[0];

            let args = message.split(" ");
            const returnValue = args.shift(); // remove the first item

            if (returnValue === undefined) {
                args = null;
            }

            const rawLanguage = language.getRawObject();

            try {
                commandHandler.processCommand(bot, command, args, language, rawSender, (res) => {
                    let originalCommand;

                    if (!res.announcement) {
                        if (res.twoMessages) {
                            channel.send(res.first);
                            channel.send(res.second);
                        } else {
                            channel.send(res.message);
                        }

                        Object.keys(rawLanguage.commands).forEach((originalCommandName) => {
                            if (rawLanguage.commands[originalCommandName] === command) {
                                originalCommand = originalCommandName;
                            } else if (command === "eval") {
                                originalCommand = "eval";
                            } else if (command === "jepekula") {
                                originalCommand = "jepekula";
                            } else if (command === "joseph") {
                                originalCommand = "joseph";
                            } else if (command === "supporters") {
                                originalCommand = "supporters";
                            }
                        });
                    } else {
                        Object.keys(rawLanguage.commands).forEach((originalCommandName) => {
                            if (rawLanguage.commands[originalCommandName] === command) {
                                originalCommand = originalCommandName;
                            }
                        });

                        bot.guilds.forEach((value) => {
                            if (value.name === "Discord Bots" ||
                                value.name === "Discord Bot List") {
                                return;
                            }

                            let sent = false;
                            const ch = value.channels.findAll("type", "text");
                            const preferred = ["misc", "bots", "meta", "hangout", "fellowship", "lounge", "congregation", "general",
                                "taffer", "family_text", "staff"
                            ];

                            for (let i = 0; i < preferred.length; i++) {
                                if (!sent) {
                                    let receiver = ch.find((val) => val.name === preferred[i]);

                                    if (receiver) {
                                        receiver.send(res.message.replace(
                                            "+" + language.commands.announce + " ", ""
                                        )).catch(() => {
                                            // do nothing
                                        });

                                        sent = true;
                                    }
                                }
                            }
                        });

                        channel.send("Done.");
                    }

                    let cleanArgs = args.toString().replaceAll(",", " ");
                    if (originalCommand === "puppet" || originalCommand === "eval" || originalCommand === "announce") {
                        cleanArgs = "";
                    }

                    central.logMessage(res.level, shard, sender, source, "+" + originalCommand + " " + cleanArgs);
                });
            } catch (e) {
                central.logMessage("err", shard, sender, source, e.message);
                channel.send(e.message);
                return;
            }
        } else {
            try {
                verseHandler.processRawMessage(shard, raw, rawSender, language, (result) => {
                    if (!result.invalid) {
                        if (result.twoMessages) {
                            channel.send(result.firstMessage);
                            channel.send(result.secondMessage);
                        } else {
                            channel.send(result.message);
                        }

                        if (result.reference) {
                            central.logMessage(result.level, shard, sender, source, result.reference);
                        }
                    }
                });
            } catch (e) {
                central.logMessage("err", shard, sender, source, e.message);
                return;
            }
        }
    });
});


central.logMessage(
    "info", (bot.shard.id + 1), "global", "global", "BibleBot v" + process.env.npm_package_version +
    " by Elliott Pardee (vypr)");
bot.login(config.token);
