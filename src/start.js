import central from "./central";

// Discord API
import * as Discord from "discord.js";
var bot = new Discord.Client();
import config from "./config";

// for async calls
import * as async from "async";

// Other stuff
import books from "./books";
import Version from "./version";
import * as bibleGateway from "./bibleGateway";

bot.on("ready", () => {
    central.logMessage("info", "global", "global", "connected");
});

bot.on("debug", debug => {
    if (config.debug) {
        central.logMessage("debug", "global", "global", debug);
    }
});

bot.on("reconnecting", () => {
    central.logMessage("info", "global", "global", "attempting to reconnect");
});

bot.on("disconnect", () => {
    central.logMessage("info", "global", "global", "disconnected");
});

bot.on("warning", warn => {
    central.logMessage("warn", "global", "global", warn);
});

bot.on("error", e => {
    central.logMessage("err", "global", "global", e);
});

bot.on("message", raw => {
    // taking the raw message object and making it more usable
    var rawSender = raw.author;
    var sender = rawSender.username + "#" + rawSender.discriminator;
    var channel = raw.channel;
    var guild = raw.guild;
    var msg = raw.content;
    var source;

    if (config.debug) {
        // TODO: Replace this with user IDs.
        switch (sender) {
            case "vipr#4035":
            case "mimi_jean#6467":
            case "UnimatrixZeroOne#7501":
            case "redpanda#7299":
                break;
            default:
                if (config.versionAdders.indexOf(sender) != -1) {
                    break;
                } else {
                    return;
                }
        }
    }

    if (central.isUnmigrated(sender)) {
        central.migrateUserToID(rawSender);
    }

    central.getLanguage(rawSender, (language) => {
        if (typeof language == "undefined") {
            language = central.languages.english_us;
        }

        if ((typeof channel.guild != "undefined") &&
            (typeof channel.name != "undefined")) {
            source = channel.guild.name + "#" + channel.name;
        } else {
            source = "unknown";
        }

        if (sender == config.botname) return;
        if (source.includes("Discord Bots") &&
            sender != config.owner)
            return;

        // for verse arrays
        var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k",
            "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x",
            "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K",
            "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X",
            "Y", "Z"
        ];

        if (msg == "+" + language.rawobj.commands.leave &&
            sender == config.owner) {
            central.logMessage("info", sender, source, "+leave");

            try {
                if (guild !== undefined) {
                    guild.leave();
                }
            } catch (e) {
                channel.sendMessage(e);
            }
        } else if (msg.startsWith("+" + language.rawobj.commands.announce) &&
            sender == config.owner) {
            bot.guilds.forEach((value) => {
                var sent = false;
                var ch = value.channels.findAll("type", "text");
                var preferred = ["meta", "hangout", "fellowship", "lounge", "congregation", "general",
                    "taffer"
                ];

                for (var i = 0; i < preferred.length; i++) {
                    if (!sent) {
                        var receiver = ch.find(val => val.name === preferred[i]);

                        if (receiver) {
                            receiver.sendMessage(msg.replace(
                                "+" + language.rawobj.commands.announce + " ", ""
                            )).catch(() => { /* ignore */ });

                            sent = true;
                        }
                    }
                }
            });

            central.logMessage("info", sender, source, "+announce");
        } else if (msg.startsWith("+" + language.rawobj.commands.puppet) &&
            sender == config.owner) {
            // requires manage messages permission (optional)
            raw.delete().then(msg => central.logMessage("info", sender, source, msg))
                .catch(central.logMessage("info", sender, source, msg));
            channel.sendMessage(msg.replaceAll("+" +
                language.rawobj.commands.puppet + " ", ""));
        } else if (msg.startsWith("+eval") && sender == config.owner) {
            try {
                central.logMessage("info", sender, source, "+eval");

                var argument = msg.replace("+eval ", "");

                if (argument.indexOf("bot.token") > -1) {
                    throw "I refuse to process anything with bot.token for " +
                        "the sake of bot security."
                }

                channel.sendMessage(eval(argument));
            } catch (e) {
                channel.sendMessage("[error] " + e);
            }
        } else if (msg == "+" + language.rawobj.commands.allusers) {
            var users = bot.users.size;

            bot.users.forEach((v) => {
                if (v.bot) users--;
            });

            central.logMessage("info", sender, source, "+allusers");
            channel.sendMessage(language.rawobj.allusers + ": " + users.toString());
        } else if (msg == "+" + language.rawobj.commands.users) {
            if (guild) {
                var users = guild.members.size;

                guild.members.forEach((v) => {
                    if (v.user.bot) users--;
                });

                central.logMessage("info", sender, source, "+users");
                channel.sendMessage(language.rawobj.users + ": " + users.toString());
            } else {
                central.logMessage("info", sender, source, "failed +users");
                channel.sendMessage(language.rawobj.usersfailed);
            }
        } else if (msg == "+" + language.rawobj.commands.listservers) {
            var count = bot.guilds.size.toString();
            var list = "";

            bot.guilds.forEach((v) => {
                list += v + ", ";
            });

            var msgend = language.rawobj.listserversend;
            msgend = msgend.replace("<number>", count);


            var response = language.rawobj.listservers + ": ```" +
                list.slice(0, -2) + "```\n" + msgend;

            central.logMessage("info", sender, source, "+listservers");
            channel.sendMessage(response);
        } else if (msg == "+" + language.rawobj.commands.biblebot) {
            central.logMessage("info", sender, source, "+biblebot");

            var response = language.rawobj.biblebot;
            response = response.replace(
                "<biblebotversion>", process.env.npm_package_version);
            response = response.replace(
                "<setversion>", language.rawobj.commands.setversion);
            response = response.replace(
                "<version>", language.rawobj.commands.version);
            response = response.replace(
                "<versions>", language.rawobj.commands.versions);
            response = response.replace(
                "<versioninfo>", language.rawobj.commands.versioninfo);
            response = response.replace(
                "<votd>", language.rawobj.commands.votd);
            response = response.replace(
                "<verseoftheday>", language.rawobj.commands.verseoftheday);
            response = response.replace(
                "<random>", language.rawobj.commands.random);
            response = response.replace(
                "<biblebot>", language.rawobj.commands.biblebot);
            response = response.replace(
                "<addversion>", language.rawobj.commands.addversion);
            response = response.replace(
                "<av>", language.rawobj.commands.av);
            response = response.replace(
                "<versenumbers>", language.rawobj.commands.versenumbers);
            response = response.replace(
                "<headings>", language.rawobj.commands.headings);
            response = response.replace(
                "<puppet>", language.rawobj.commands.puppet);
            response = response.replace(
                "<setlanguage>", language.rawobj.commands.setlanguage);
            response = response.replace(
                "<language>", language.rawobj.commands.language);
            response = response.replace(
                "<languages>", language.rawobj.commands.languages);
            response = response.replaceAll(
                "<enable>", language.rawobj.arguments.enable);
            response = response.replaceAll(
                "<disable>", language.rawobj.arguments.disable);
            response = response.replace(
                "<allusers>", language.rawobj.commands.allusers);
            response = response.replace(
                "<users>", language.rawobj.commands.users);
            response = response.replace(
                "<usersindb>", language.rawobj.commands.usersindb);
            response = response.replace(
                "<listservers>", language.rawobj.commands.listservers);

            response += "\n\n---\n**Help BibleBot's development and hosting by becoming a patron on Patreon! See <https://patreon.com/BibleBot> for more information!**";
            response += "\n---\n\nSee <https://biblebot.vypr.space/copyrights> for any copyright-related information.";

            channel.sendMessage(response);
        } else if (msg == "+" + language.rawobj.commands.random) {
            central.getVersion(rawSender, (data) => {
                var version = language.defversion;
                var headings = "enable";
                var verseNumbers = "enable";

                if (data) {
                    if (data[0].hasOwnProperty('version')) {
                        version = data[0].version;
                    }
                    if (data[0].hasOwnProperty('headings')) {
                        headings = data[0].headings;
                    }
                    if (data[0].hasOwnProperty('verseNumbers')) {
                        verseNumbers = data[0].verseNumbers;
                    }
                }

                bibleGateway.getRandomVerse(version, headings, verseNumbers)
                    .then((result) => {
                        central.logMessage("info", sender, source, "+random");
                        channel.sendMessage(result);
                    });
            });
        } else if (msg == ("+" + language.rawobj.commands.verseoftheday) ||
            msg == ("+" + language.rawobj.commands.votd)) {
            central.getVersion(rawSender, (data) => {
                var version = language.defversion;
                var headings = "enable";
                var verseNumbers = "enable";

                if (data) {
                    if (data[0].hasOwnProperty('version')) {
                        version = data[0].version;
                    }
                    if (data[0].hasOwnProperty('headings')) {
                        headings = data[0].headings;
                    }
                    if (data[0].hasOwnProperty('verseNumbers')) {
                        verseNumbers = data[0].verseNumbers;
                    }
                }

                bibleGateway.getVOTD(version, headings, verseNumbers)
                    .then((result) => {
                        if (result == "too long") {
                            channel.sendMessage(language.rawobj.passagetoolong);
                            return;
                        }

                        central.logMessage("info", sender, source, "+votd");
                        channel.sendMessage(result);
                    });
            });
        } else if (msg.startsWith("+" + language.rawobj.commands.setversion)) {
            if (msg.split(" ").length != 2) {
                central.versionDB.find({}, (err, docs) => {
                    var chatString = "";
                    for (var i in docs) {
                        chatString += docs[i].abbv + ", ";
                    }

                    central.logMessage(
                        "info", sender, source, "empty +setversion sent");
                    raw.reply("**" + language.rawobj.setversionfail +
                        ":**\n```" + chatString.slice(0, -2) + "```");
                });
                return;
            } else {
                central.setVersion(rawSender, msg.split(" ")[1], (data) => {
                    if (data) {
                        central.logMessage("info", sender, source, "+setversion " +
                            msg.split(" ")[1]);
                        raw.reply("**" + language.rawobj.setversionsuccess +
                            "**");
                    } else {
                        central.versionDB.find({}, (err, docs) => {
                            var chatString = "";
                            for (var i in docs) {
                                chatString += docs[i].abbv + ", ";
                            }

                            central.logMessage("info", sender, source,
                                "failed +setversion");
                            raw.reply("**" + language.rawobj.setversionfail +
                                ":**\n```" + chatString.slice(0, -2) +
                                "```");
                        });
                    }
                });
            }

            return;
        } else if (msg.startsWith("+" + language.rawobj.commands.headings)) {
            if (msg.split(" ").length != 2) {
                central.logMessage("info", sender, source, "empty +headings sent");

                var response = language.rawobj.headingsfail;

                response = response.replace(
                    "<headings>", language.rawobj.commands.headings);
                response = response.replace(
                    "<headings>", language.rawobj.commands.headings);
                response = response.replace(
                    "<enable>", language.rawobj.arguments.enable);
                response = response.replace(
                    "<disable>", language.rawobj.arguments.disable);

                raw.reply("**" + response + "**");
            } else {
                var option;

                switch (msg.split(" ")[1]) {
                    case language.rawobj.arguments.enable:
                        option = "enable";
                        break;
                    case language.rawobj.arguments.disable:
                        option = "disable";
                        break;
                    default:
                        option = null;
                        break;
                }

                if (option !== null) {
                    central.setHeadings(rawSender, option, (data) => {
                        if (data) {
                            central.logMessage(
                                "info", sender, source, "+headings " +
                                option);
                            var response = language.rawobj.headingssuccess;
                            response = response.replace(
                                "<headings>", language.rawobj.commands.headings);

                            raw.reply("**" + response + "**");
                        } else {
                            central.logMessage("info", sender, source, "failed +headings");

                            var response = language.rawobj.headingsfail;

                            response = response.replace(
                                "<headings>", language.rawobj.commands.headings);
                            response = response.replace(
                                "<headings>", language.rawobj.commands.headings);
                            response = response.replace(
                                "<enable>", language.rawobj.arguments.enable);
                            response = response.replace(
                                "<disable>", language.rawobj.arguments.disable);

                            raw.reply("**" + response + "**");
                        }
                    });
                } else {
                    central.logMessage("info", sender, source, "failed +headings");

                    var response = language.rawobj.headingsfail;

                    response = response.replace(
                        "<headings>", language.rawobj.commands.headings);
                    response = response.replace(
                        "<headings>", language.rawobj.commands.headings);
                    response = response.replace(
                        "<enable>", language.rawobj.arguments.enable);
                    response = response.replace(
                        "<disable>", language.rawobj.arguments.disable);

                    raw.reply("**" + response + "**");
                }
            }

            return;
        } else if (msg.startsWith(
                "+" + language.rawobj.commands.versenumbers)) {
            if (msg.split(" ").length != 2) {
                central.logMessage("info", sender, source, "empty +versenumbers sent");

                var response = language.rawobj.versenumbersfail;

                response = response.replace(
                    "<versenumbers>", language.rawobj.commands.versenumbers);
                response = response.replace(
                    "<versenumbers>", language.rawobj.commands.versenumbers);
                response = response.replace(
                    "<enable>", language.rawobj.arguments.enable);
                response = response.replace(
                    "<disable>", language.rawobj.arguments.disable);

                raw.reply("**" + response + "**");
            } else {
                var option;

                switch (msg.split(" ")[1]) {
                    case language.rawobj.arguments.enable:
                        option = "enable";
                        break;
                    case language.rawobj.arguments.disable:
                        option = "disable";
                        break;
                    default:
                        option = null;
                        break;
                }

                if (option !== null) {
                    central.setVerseNumbers(rawSender, option, (data) => {
                        if (data) {
                            central.logMessage(
                                "info", sender, source, "+versenumbers " +
                                option);

                            var response = language.rawobj.versenumberssuccess;
                            response = response.replace(
                                "<versenumbers>",
                                language.rawobj.commands.versenumbers);

                            raw.reply("**" + response + "**");
                        } else {
                            central.logMessage(
                                "info", sender, source, "failed +versenumbers");

                            var response = language.rawobj.versenumbersfail;

                            response = response.replace(
                                "<versenumbers>",
                                language.rawobj.commands.versenumbers);
                            response = response.replace(
                                "<versenumbers>",
                                language.rawobj.commands.versenumbers);
                            response = response.replace(
                                "<enable>",
                                language.rawobj.arguments.enable);
                            response = response.replace(
                                "<disable>",
                                language.rawobj.arguments.disable);

                            raw.reply("**" + response + "**");
                        }
                    });
                } else {
                    central.logMessage(
                        "info", sender, source, "failed +versenumbers");

                    var response = language.rawobj.versenumbersfail;

                    response = response.replace(
                        "<versenumbers>",
                        language.rawobj.commands.versenumbers);
                    response = response.replace(
                        "<versenumbers>",
                        language.rawobj.commands.versenumbers);
                    response = response.replace(
                        "<enable>",
                        language.rawobj.arguments.enable);
                    response = response.replace(
                        "<disable>",
                        language.rawobj.arguments.disable);

                    raw.reply("**" + response + "**");
                }
            }

            return;
        } else if (msg == "+" + language.rawobj.commands.version) {
            central.getVersion(rawSender, (data) => {
                central.logMessage("info", sender, source, "+version");

                if (data) {
                    if (data[0].version) {
                        var response = language.rawobj.versionused;

                        response = response.replace(
                            "<version>", data[0].version);
                        response = response.replace(
                            "<setversion>", language.rawobj.commands.setversion);

                        raw.reply("**" + response + ".**");
                    } else {
                        var response = language.rawobj.noversionused;

                        response = response.replace(
                            "<setversion>", language.rawobj.commands.setversion);

                        raw.reply("**" + response + "**");
                    }
                } else {
                    var response = language.rawobj.noversionused;

                    response = response.replace(
                        "<setversion>", language.rawobj.commands.setversion);

                    raw.reply("**" + response + "**");
                }
            });

            return;
        } else if (msg == "+" + language.rawobj.commands.versions) {
            central.versionDB.find({}, (err, docs) => {
                var chatString = "";
                for (var i in docs) {
                    chatString += docs[i].abbv + ", ";
                }

                central.logMessage("info", sender, source, "+versions");
                raw.reply("**" + language.rawobj.versions + ":**\n```" +
                    chatString.slice(0, -2) + "```");
            });
        } else if (msg.startsWith(
                "+" + language.rawobj.commands.setlanguage)) {
            if (msg.split(" ").length != 2) {
                var chatString = "";
                Object.keys(central.languages).forEach((key) => {
                    switch (key) {
                        case "deflang":
                        case "isLanguage":
                        case "isIncomplete":
                            return;
                        default:
                            chatString += central.languages[key].name + " [" + key +
                                "], ";
                            break;
                    }
                });

                central.logMessage("info", sender, source, "empty +setlanguage sent");
                raw.reply("**" + language.rawobj.setlanguagefail + ":**\n```" +
                    chatString.slice(0, -2) + "```");
                return;
            } else {
                central.setLanguage(rawSender, msg.split(" ")[1], (data) => {
                    if (data) {
                        central.logMessage("info", sender, source, "+setlanguage " +
                            msg.split(" ")[1]);
                        raw.reply("**" + language.rawobj.setlanguagesuccess +
                            "**");
                    } else {
                        var chatString = "";
                        Object.keys(central.languages).forEach((key) => {
                            switch (key) {
                                case "deflang":
                                case "isLanguage":
                                case "isIncomplete":
                                    return;
                                default:
                                    chatString += central.languages[key].name + " [" +
                                        key + "], ";
                                    break;
                            }
                        });

                        central.logMessage(
                            "info", sender, source, "failed +setlanguage");
                        raw.reply("**" + language.rawobj.setlanguagefail +
                            ":**\n```" + chatString.slice(0, -2) +
                            "```");
                    }
                });
            }

            return;
        } else if (msg == "+" + language.rawobj.commands.language) {
            central.getLanguage(rawSender, (data) => {
                central.logMessage("info", sender, source, "+language");

                if (data) {
                    var response = language.rawobj.languageused;

                    response = response.replace(
                        "<setlanguage>", language.rawobj.commands.setlanguage);

                    raw.reply("**" + response + "**");
                } else {
                    var response = language.rawobj.languageused;

                    response = response.replace(
                        "<setlanguage>", language.rawobj.commands.setlanguage);

                    raw.reply("**" + response + "**");
                }

            });

            return;
        } else if (msg == "+" + language.rawobj.commands.languages) {
            var chatString = "";
            Object.keys(central.languages).forEach((key) => {
                switch (key) {
                    case "default": // i don't need this, but JS is being weird
                    case "isLanguage":
                    case "isIncomplete":
                        return;
                    default:
                        chatString += central.languages[key].name + " [" + key + "], ";
                        break;
                }
            });

            central.logMessage("info", sender, source, "+languages");
            raw.reply("**" + language.rawobj.languages + ":**\n```" +
                chatString.slice(0, -2) + "```");
            return;
        } else if (msg.startsWith("+" + language.rawobj.commands.addversion) ||
            msg.startsWith("+" + language.rawobj.commands.av)) {
            if (sender == config.owner) {

                var argv = msg.split(" ");
                var argc = argv.length;
                var name = "";

                // build the name string
                for (var i = 1; i < (argv.length - 4); i++) {
                    name = name + argv[i] + " ";
                }

                name = name.slice(0, -1); // remove trailing space
                var abbv = argv[argc - 4];
                var hasOT = argv[argc - 3];
                var hasNT = argv[argc - 2];
                var hasAPO = argv[argc - 1];

                var object = new Version(name, abbv, hasOT, hasNT, hasAPO);
                central.versionDB.insert(object.toObject(), (err) => {
                    if (err) {
                        central.logMessage("err", "versiondb", "global", err);
                        raw.reply(
                            "**" + language.rawobj.addversionfail + "**");
                    } else {
                        raw.reply(
                            "**" + language.rawobj.addversionsuccess + "**");
                    }
                });
            }
        } else if (msg.startsWith("+" + language.rawobj.commands.versioninfo)) {
            if (msg.split(" ").length == 2) {
                central.versionDB.find({
                    "abbv": msg.split(" ")[1]
                }, (err, data) => {
                    data = data; // for some reason it won't initialize properly

                    if (err) {
                        central.logMessage("err", "versiondb", "global", err);
                        raw.reply(
                            "**" + language.rawobj.versioninfofailed + "**");
                    } else if (data.length > 0) {
                        central.logMessage("info", sender, source, "+versioninfo");

                        var response = language.rawobj.versioninfo;
                        response = response.replace("<versionname>", data[0].name);

                        if (data[0].hasOT == true)
                            response = response.replace("<hasOT>", language.rawobj.arguments.yes);
                        else
                            response = response.replace("<hasOT>", language.rawobj.arguments.no);

                        if (data[0].hasNT == true)
                            response = response.replace("<hasNT>", language.rawobj.arguments.yes);
                        else
                            response = response.replace("<hasNT>", language.rawobj.arguments.no);

                        if (data[0].hasAPO == true)
                            response = response.replace("<hasAPO>", language.rawobj.arguments.yes);
                        else
                            response = response.replace("<hasAPO>", language.rawobj.arguments.no);

                        raw.reply(response);
                    } else {
                        raw.reply("**" + language.rawobj.versioninfofailed + "**");
                    }
                });
            } else {

            }
        } else if (msg.includes(":") && msg.includes(" ")) {
            var spaceSplit = [];
            var bookIndexes = [];
            var bookNames = [];
            var verses = {};
            var verseCount = 0;

            if (msg.includes("-")) {
                msg.split("-").forEach((item) => {
                    var tempSplit = item.split(":");

                    tempSplit.forEach((item) => {
                        var tempTempSplit = item.split(" ");

                        tempTempSplit.forEach((item) => {
                            item = item.replaceAll(/[^a-zA-Z0-9:()"'<>|\\/;*&^%$#@!.+_?=]/g, "");

                            spaceSplit.push(item);
                        });
                    });
                });
            } else {
                msg.split(":").forEach((item) => {
                    var tempSplit = item.split(" ");

                    tempSplit.forEach((item) => {
                        spaceSplit.push(item);
                    });
                });
            }

            // because of multiple verses with the same book, this
            // must be done to ensure that its not duping itself.
            for (var i = 0; i < spaceSplit.length; i++) {
                try {
                    spaceSplit[i] = spaceSplit[i].replaceAll("(", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll(")", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll("[", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll("]", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll("<", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll(">", "");
                    spaceSplit[i] = central.capitalizeFirstLetter(spaceSplit[i]);
                } catch (e) {
                    /* it'll probably be a number anyways, if this fails */
                }

                // TODO: Rewrite/refactor this.
                switch (spaceSplit[i]) {
                    case "Sam":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Sm":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Shmuel":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Kgs":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Melachim":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Chron":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Chr":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Cor":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Thess":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Thes":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Tim":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Tm":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Pet":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Pt":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Macc":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Mac":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Esd":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Jn":
                        var num = Number(spaceSplit[i - 1]);
                        var bnum = typeof Number(
                            spaceSplit[i - 1]) == "number";

                        if (spaceSplit[i - 1] && bnum && typeof num == "number" &&
                            num > 0 && num < 4) {
                            var temp = spaceSplit[i];
                            spaceSplit[i] = spaceSplit[i - 1] + temp;
                        }
                        break;
                    case "Samuel":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Kings":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Chronicles":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Esdras":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Maccabees":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Corinthians":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Thessalonians":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Timothy":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Peter":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "John":
                        var num = Number(spaceSplit[i - 1]);
                        var bnum = typeof Number(
                            spaceSplit[i - 1]) == "number";

                        if (spaceSplit[i - 1] && bnum &&
                            typeof num == "number" && num > 0 && num < 4) {

                            var temp = spaceSplit[i];
                            spaceSplit[i] = spaceSplit[i - 1] + temp;
                        }
                        break;
                    case "Solomon":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 2] + spaceSplit[i - 1] +
                            temp;
                        break;
                    case "Songs":
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 2] + spaceSplit[i - 1] +
                            temp;
                        break;
                }

                if (books.ot[spaceSplit[i].toLowerCase()]) {
                    bookNames.push(books.ot[spaceSplit[i].toLowerCase()]);
                    bookIndexes.push(i);
                }

                if (books.nt[spaceSplit[i].toLowerCase()]) {
                    bookNames.push(books.nt[spaceSplit[i].toLowerCase()]);
                    bookIndexes.push(i);
                }

                if (books.apo[spaceSplit[i].toLowerCase()]) {
                    bookNames.push(books.apo[spaceSplit[i].toLowerCase()]);
                    bookIndexes.push(i);
                }
            }

            bookIndexes.forEach((index) => {
                var verse = [];

                // make sure that its proper verse structure
                // Book chapterNum:chapterVerse
                if (Number.isNaN(spaceSplit[index + 1]) ||
                    Number.isNaN(spaceSplit[index + 2])) {
                    return;
                }

                verse.push(spaceSplit[index]); // book name
                verse.push(spaceSplit[index + 1]); // book chapter
                verse.push(spaceSplit[index + 2]); // starting verse

                if (spaceSplit[index + 3] !== undefined) {
                    if (!Number.isNaN(spaceSplit[index + 3])) {
                        if (Number(spaceSplit[index + 3]) >
                            Number(spaceSplit[index + 2])) {
                            verse.push(spaceSplit[index + 3]); // ending verse
                        }
                    }
                }

                verses[alphabet[verseCount]] = verse;
                verseCount++;
            });

            if (verseCount > 4) {
                var responses = ["spamming me, really?", "no spam pls",
                    "no spam, am good bot", "be nice to me",
                    "don't spam me, i'm a good bot", "hey buddy, get your own " +
                    "bot to spam"
                ];
                var randomIndex = Math.floor(Math.random() * (4 - 0)) + 0;

                channel.sendMessage(responses[randomIndex]);

                central.logMessage("warn", sender, source,
                    "spam attempt - verse count: " + verseCount);
                return;
            }

            async.each(verses, (verse) => {
                for (var i = 0; i < verse.length; i++) {
                    if (typeof verse[i] != "undefined") {
                        verse[i] = verse[i].replaceAll(/[^a-zA-Z0-9:]/g, "");
                    }
                }

                if (Number.isNaN(verse[1]) || Number.isNaN(verse[2])) {
                    return;
                }

                if (verse.length < 4) {
                    var properString = verse[0] + " " + verse[1] +
                        ":" + verse[2];
                } else {
                    var properString = verse[0] + " " + verse[1] + ":" +
                        verse[2] + "-" + verse[3];
                }


                central.getVersion(rawSender, (data) => {
                    var version = language.defversion;
                    var headings = "enable";
                    var verseNumbers = "enable";

                    if (data) {
                        if (data[0].hasOwnProperty('version')) {
                            version = data[0].version;
                        }
                        if (data[0].hasOwnProperty('headings')) {
                            headings = data[0].headings;
                        }
                        if (data[0].hasOwnProperty('verseNumbers')) {
                            verseNumbers = data[0].verseNumbers;
                        }
                    }

                    central.versionDB.find({
                        "abbv": version
                    }, (err, docs) => {
                        if (docs) {
                            bookNames.forEach((book) => {
                                var isOT = false;
                                var isNT = false;
                                var isAPO = false;

                                for (var index in books.ot) {
                                    if (books.ot[index] == book) {
                                        isOT = true;
                                    }
                                }

                                if (!docs[0].hasOT && isOT) {
                                    central.logMessage("info", sender, source,
                                        "this sender is trying to use the OT " +
                                        "with a version that doesn't have it.");

                                    var response =
                                        language.rawobj.otnotsupported;
                                    response = response.replace(
                                        "<version>", docs[0].name);

                                    var response2 =
                                        language.rawobj.otnotsupported2;
                                    response2 = response2.replace(
                                        "<setversion>",
                                        language.rawobj.commands.setversion);

                                    channel.sendMessage(response);
                                    channel.sendMessage(response2);

                                    return;
                                }

                                for (var index in books.nt) {
                                    if (books.nt[index] == book) {
                                        isNT = true;
                                    }
                                }

                                if (!docs[0].hasNT && isNT) {
                                    central.logMessage(
                                        "info", sender, source,
                                        "this sender is trying to use the NT " +
                                        "with a version that doesn't have it.");

                                    var response =
                                        language.rawobj.ntnotsupported;
                                    response = response.replace(
                                        "<version>", docs[0].name);

                                    var response2 =
                                        language.rawobj.ntnotsupported2;
                                    response2 = response2.replace(
                                        "<setversion>",
                                        language.rawobj.commands.setversion);

                                    channel.sendMessage(response);
                                    channel.sendMessage(response2);

                                    return;
                                }

                                for (var index in books.apo) {
                                    if (books.apo[index] == book) {
                                        isAPO = true;
                                    }
                                }

                                if (!docs[0].hasAPO && isAPO) {
                                    central.logMessage(
                                        "info", sender, source,
                                        "this sender is trying to use the APO " +
                                        "with a version that doesn't have it.");

                                    var response =
                                        language.rawobj.aponotsupported;
                                    response = response.replace(
                                        "<version>", docs[0].name);

                                    var response2 =
                                        language.rawobj.aponotsupported2;
                                    response2 = response2.replace(
                                        "<setversion>",
                                        language.rawobj.commands.setversion);

                                    channel.sendMessage(response);
                                    channel.sendMessage(response2);

                                    return;
                                }
                            });

                            bibleGateway.getResult(
                                    properString, version, headings, verseNumbers)
                                .then((result) => {
                                    result.forEach((object) => {
                                        var content =
                                            "```Dust\n" + object.title + "\n\n" +
                                            object.text + "```";

                                        var responseString =
                                            "**" + object.passage + " - " +
                                            object.version + "**\n\n" + content;

                                        var randomNumber = Math.floor(Math.random() * 20);

                                        if (randomNumber == 10) {
                                            responseString += "\n\n**Help BibleBot's development and hosting by becoming a patron on Patreon! See <https://patreon.com/BibleBot> for more information!**";
                                            properString += " - patreon added";
                                        }

                                        if (responseString.length < 2000) {
                                            central.logMessage(
                                                "info", sender, source,
                                                properString);
                                            channel.sendMessage(responseString);
                                        } else {
                                            central.logMessage(
                                                "info", sender, source, "length of " +
                                                properString +
                                                " is too long for me");
                                            channel.sendMessage(
                                                language.rawobj.passagetoolong);
                                        }
                                    });
                                }).catch((err) => {
                                    central.logMessage(
                                        "err", "global", "bibleGateway", err);
                                });
                        }
                    });
                });
            });
        }
    });
});


central.logMessage(
    "info", "global", "global", "BibleBot v" + process.env.npm_package_version +
    " by Elliott Pardee (vypr)");
bot.login(config.token);