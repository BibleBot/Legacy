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
    shard = bot.shard.id + 1;
    if (config.debug) {
        central.logMessage("debug", (bot.shard.id + 1), "global", "global", debug);
    }
});

bot.on("reconnecting", () => {
    shard = bot.shard.id + 1;
    central.logMessage("info", shard, "global", "global", "attempting to reconnect");
});

bot.on("disconnect", () => {
    shard = bot.shard.id + 1;
    central.logMessage("info", shard, "global", "global", "disconnected");
});

bot.on("warning", (warn) => {
    shard = bot.shard.id + 1;
    central.logMessage("warn", shard, "global", "global", warn);
});

bot.on("error", (e) => {
    shard = bot.shard.id + 1;
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

            commandHandler.processCommand(bot, command, args, language, rawSender, (res) => {
                let originalCommand;

                if (!res.isError) {
                    if (!res.announcement) {
                        if (res.twoMessages) {
                            channel.send(res.first);
                            channel.send(res.second);
                        } else if (res.paged && res.pages.length !== 0) {
                            let currentPage = 1;
                            const totalPages = res.pages.length;

                            const backwardFilter = (reaction, user) => reaction.emoji.name === "⬅" && user.id !== bot.user.id;
                            const forwardFilter = (reaction, user) => reaction.emoji.name === "➡" && user.id !== bot.user.id;

                            let backwardCollector;
                            let forwardCollector;

                            channel.send(res.pages[currentPage - 1]).then((msg) => {
                                msg.react("⬅");
                                central.sleep(1000);
                                msg.react("➡");

                                backwardCollector = msg.createReactionCollector(backwardFilter, { time: 120000 });
                                forwardCollector = msg.createReactionCollector(forwardFilter, { time: 120000 });

                                backwardCollector.on("collect", () => {
                                    if (currentPage === 1) {
                                        return;
                                    } else {
                                        currentPage--;
                                        msg.edit(res.pages[currentPage - 1]);
                                    }
                                });

                                forwardCollector.on("collect", () => {
                                    if (currentPage === totalPages) {
                                        return;
                                    } else {
                                        currentPage++;
                                        msg.edit(res.pages[currentPage - 1]);
                                    }
                                });

                                backwardCollector.on("end", () => {
                                    msg.clearReactions();
                                });

                                forwardCollector.on("end", () => {
                                    msg.clearReactions();
                                });
                            });
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

                        let evalString = `
                        this.guilds.forEach((value) => {
                            const RichEmbed = require("discord.js").RichEmbed;
                            
                            const embed = new RichEmbed();
                            
                            embed.setColor(303102);
                            embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");
                            embed.addField("Announcement", "${res.message}", false);

                            if (value.name === "Discord Bots" ||
                                value.name === "Discord Bot List") {
                                return;
                            }

                            if (value.id !== "362503610006765568") {
                                let sent = false;
                                const ch = value.channels.findAll("type", "text");
                                const preferred = ["misc", "bots", "meta", "hangout", "fellowship", "lounge", "congregation", "general",
                                    "taffer", "family_text", "staff"
                                ];

                                for (let i = 0; i < preferred.length; i++) {
                                    if (!sent) {
                                        let receiver = ch.find((val) => val.name === preferred[i]);

                                        if (receiver) {
                                            receiver.send(embed).catch(() => {
                                                // do nothing
                                            });

                                            sent = true;
                                        }
                                    }
                                }
                            } else {
                                const ch = value.channels.findAll("type", "text");
                                let receiver = ch.find((val) => val.name === "announcements");

                                if (receiver) {
                                    receiver.send(embed).catch(() => {
                                        // do nothing
                                    });      
                                }
                            }
                        });`;

                        bot.shard.broadcastEval(evalString).then(() => {
                            channel.send("Done.");
                        }).catch(() => {
                            // do nothing
                        });
                    }

                    let cleanArgs = args.toString().replaceAll(",", " ");
                    if (originalCommand === "puppet" ||
                        originalCommand === "eval" ||
                        originalCommand === "announce") {
                        cleanArgs = "";
                    }

                    central.logMessage(res.level, shard, sender, source, "+" + originalCommand + " " + cleanArgs);
                } else {
                    channel.send(res.return);
                }
            });
        } else {
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
        }
    });
});


central.logMessage(
    "info", (bot.shard.id + 1), "global", "global", "BibleBot v" + process.env.npm_package_version +
    " by Elliott Pardee (vypr)");
bot.login(config.token);
