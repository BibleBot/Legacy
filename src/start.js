import central from "./central";

// Discord API
import * as Discord from "discord.js";
let bot = new Discord.Client();
import config from "./config";

// Other stuff
import books from "./books";
import Version from "./version";
import * as bibleGateway from "./bibleGateway";

bot.on("ready", () => {
    central.logMessage("info", "global", "global", "connected");
    bot.user.setPresence({
        status: "online",
        afk: false,
        game: {
            "name": "BibleBot v" + process.env.npm_package_version,
            "url": "https://biblebot.vypr.space"
        }
    });
});

bot.on("debug", (debug) => {
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

bot.on("warning", (warn) => {
    central.logMessage("warn", "global", "global", warn);
});

bot.on("error", (e) => {
    central.logMessage("err", "global", "global", e);
});

bot.on("message", (raw) => {
    // taking the raw message object and making it more usable
    let rawSender = raw.author;
    let sender = rawSender.username + "#" + rawSender.discriminator;
    let channel = raw.channel;
    let guild = raw.guild;
    let msg = raw.content;
    let source;

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
            source = "unknown (direct messages?)";
        }

        if (sender == config.botname) return;
        if (source.includes("Discord Bots") &&
            sender != config.owner)
            return;

        // for verse arrays
        let alphabet = "abcdef";

        if (msg == "+jepekula") {
            central.getVersion(rawSender, (data) => {
                let version = language.defversion;
                let headings = "enable";
                let verseNumbers = "enable";

                if (data) {
                    if (data[0].hasOwnProperty('version')) {
                        if (data[0].version == "HWP") version = "NRSV";
                        else version = data[0].version;
                    }
                    if (data[0].hasOwnProperty('headings')) {
                        headings = data[0].headings;
                    }
                    if (data[0].hasOwnProperty('verseNumbers')) {
                        verseNumbers = data[0].verseNumbers;
                    }
                }

                bibleGateway.getResult("Mark 9:23-24", version, headings, verseNumbers)
                    .then((result) => {
                        result.forEach((object) => {
                            let content =
                                "```Dust\n" + object.title + "\n\n" +
                                object.text + "```";

                            let responseString =
                                "**" + object.passage + " - " +
                                object.version + "**\n\n" + content;

                            if (responseString.length < 2000) {
                                central.logMessage(
                                    "info", sender, source,
                                    "+jepekula");
                                channel.send(responseString);
                            }
                        });
                    }).catch((err) => {
                        central.logMessage(
                            "err", "global", "bibleGateway", err);
                    });
            });
        } else if (msg == "+supporters") {
            central.logMessage("info", sender, source, "+supporters");
            channel.send("A special thank you to CHAZER2222, Jepekula, Joseph, Soku, and anonymous donors for financially supporting BibleBot! <3")
        } else if (msg == "+" + language.rawobj.commands.invite) {
            central.logMessage("info", sender, source, "+invite");
            channel.send("https://discordapp.com/oauth2/authorize?client_id=361033318273384449&scope=bot&permissions=0");
        } else if (msg == "+" + language.rawobj.commands.leave &&
            sender == config.owner) {
            central.logMessage("info", sender, source, "+leave");

            try {
                if (guild !== undefined) {
                    guild.leave();
                }
            } catch (e) {
                channel.send(e);
            }
        } else if (msg.startsWith("+" + language.rawobj.commands.announce) &&
            sender == config.owner) {
            bot.guilds.forEach((value) => {
                if (value.name == "Discord Bots" ||
                    value.name == "Discord Bot List") return;

                let sent = false;
                let ch = value.channels.findAll("type", "text");
                let preferred = ["misc", "bots", "meta", "hangout", "fellowship", "lounge", "congregation", "general",
                    "taffer", "family_text", "staff"
                ];

                for (let i = 0; i < preferred.length; i++) {
                    if (!sent) {
                        let receiver = ch.find(val => val.name === preferred[i]);

                        if (receiver) {
                            receiver.send(msg.replace(
                                "+" + language.rawobj.commands.announce + " ", ""
                            )).then(() => { central.logMessage("info", "announce", "global", "announced to " + value.name); }
                            ).catch((e) => { central.logMessage("err", "announce", "global", "failed to announce in " + value.name); });

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
                .catch(msg => central.logMessage("info", sender, source, msg));
            channel.send(msg.replaceAll("+" +
                language.rawobj.commands.puppet + " ", ""));
        } else if (msg.startsWith("+eval") && sender == config.owner) {
            try {
                central.logMessage("info", sender, source, "+eval");

                let argument = msg.replace("+eval ", "");

                if (argument.indexOf("bot.token") > -1) {
                    throw "I refuse to process anything with bot.token for " +
                        "the sake of bot security."
                }

                channel.send(eval(argument));
            } catch (e) {
                channel.send("[error] " + e);
            }
        } else if (msg == "+" + language.rawobj.commands.allusers) {
            let users = bot.users;
            let processed = 0;

            users.forEach((value) => {
                if (!value.bot) {
                    processed++;
                }
            });

            central.logMessage("info", sender, source, "+allusers");
            channel.send(language.rawobj.allusers + ": " + processed.toString());
        } else if (msg == "+" + language.rawobj.commands.users) {
            if (guild) {
                let users = guild.members.size;

                guild.members.forEach((v) => {
                    if (v.user.bot) users--;
                });

                central.logMessage("info", sender, source, "+users");
                channel.send(language.rawobj.users + ": " + users.toString());
            } else {
                central.logMessage("info", sender, source, "failed +users");
                channel.send(language.rawobj.usersfailed);
            }
        } else if (msg == "+" + language.rawobj.commands.listservers) {
           let count = bot.guilds.size.toString();
            let list = "";

            bot.guilds.forEach((v) => {
                list += v + ", ";
            });

            let msgend = language.rawobj.listserversend;
            msgend = msgend.replace("<number>", count);


            let response = language.rawobj.listservers;

            central.logMessage("info", sender, source, "+listservers");
            channel.send(response.replace("the following", count) + ".");
        } else if (msg == "+" + language.rawobj.commands.biblebot) {
            central.logMessage("info", sender, source, "+biblebot");

            let response = language.rawobj.biblebot;
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
            response = response.replace(
                "<invite>", language.rawobj.commands.invite);

            response += "\n\n---\n"
            
            let second = "**Help BibleBot's development and hosting by becoming a patron on Patreon! See <https://patreon.com/BibleBot> for more information!**";
            second += "\n---\n\nJoin the BibleBot Discord server! Invite: <https://discord.gg/Ssn8KNv>\nSee <https://biblebot.vypr.space/copyrights> for any copyright-related information.";

            channel.send(response);
            channel.send(second);
        } else if (msg == "+" + language.rawobj.commands.random) {
            central.getVersion(rawSender, (data) => {
                let version = language.defversion;
                let headings = "enable";
                let verseNumbers = "enable";

                if (data) {
                    if (data[0].hasOwnProperty('version')) {
                        if (data[0].version == "HWP") version = "NRSV";
                        else version = data[0].version;
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
                        channel.send(result);
                    });
            });
        } else if (msg == ("+" + language.rawobj.commands.verseoftheday) ||
            msg == ("+" + language.rawobj.commands.votd)) {
            central.getVersion(rawSender, (data) => {
                let version = language.defversion;
                let headings = "enable";
                let verseNumbers = "enable";

                if (data) {
                    if (data[0].hasOwnProperty('version')) {
                        if (data[0].version == "HWP") version = "NRSV";
                        else version = data[0].version;
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
                            channel.send(language.rawobj.passagetoolong);
                            return;
                        }

                        central.logMessage("info", sender, source, "+votd");
                        channel.send(result);
                    });
            });
        } else if (msg.startsWith("+" + language.rawobj.commands.setversion)) {
            if (msg.split(" ").length != 2) {
                central.versionDB.find({}, (err, docs) => {
                    let chatString = "";
                    for (let i in docs) {
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
                            let chatString = "";
                            for (let i in docs) {
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

                let response = language.rawobj.headingsfail;

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
                let option;

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
                            let response = language.rawobj.headingssuccess;
                            response = response.replace(
                                "<headings>", language.rawobj.commands.headings);

                            raw.reply("**" + response + "**");
                        } else {
                            central.logMessage("info", sender, source, "failed +headings");

                            let response = language.rawobj.headingsfail;

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

                    let response = language.rawobj.headingsfail;

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

                let response = language.rawobj.versenumbersfail;

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
                let option;

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

                            let response = language.rawobj.versenumberssuccess;
                            response = response.replace(
                                "<versenumbers>",
                                language.rawobj.commands.versenumbers);

                            raw.reply("**" + response + "**");
                        } else {
                            central.logMessage(
                                "info", sender, source, "failed +versenumbers");

                            let response = language.rawobj.versenumbersfail;

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

                    let response = language.rawobj.versenumbersfail;

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
                        if (data[0].version == "HWP") data[0].version = "NRSV";
                        let response = language.rawobj.versionused;

                        response = response.replace(
                            "<version>", data[0].version);
                        response = response.replace(
                            "<setversion>", language.rawobj.commands.setversion);

                        raw.reply("**" + response + ".**");
                    } else {
                        let response = language.rawobj.noversionused;

                        response = response.replace(
                            "<setversion>", language.rawobj.commands.setversion);

                        raw.reply("**" + response + "**");
                    }
                } else {
                    let response = language.rawobj.noversionused;

                    response = response.replace(
                        "<setversion>", language.rawobj.commands.setversion);

                    raw.reply("**" + response + "**");
                }
            });

            return;
        } else if (msg == "+" + language.rawobj.commands.versions) {
            central.versionDB.find({}, (err, docs) => {
                let chatString = "";
                for (let i in docs) {
                    chatString += docs[i].abbv + ", ";
                }

                central.logMessage("info", sender, source, "+versions");
                raw.reply("**" + language.rawobj.versions + ":**\n```" +
                    chatString.slice(0, -2) + "```");
            });
        } else if (msg.startsWith(
                "+" + language.rawobj.commands.setlanguage)) {
            if (msg.split(" ").length != 2) {
                let chatString = "";
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
                        let chatString = "";
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
                    let response = language.rawobj.languageused;

                    response = response.replace(
                        "<setlanguage>", language.rawobj.commands.setlanguage);

                    raw.reply("**" + response + "**");
                } else {
                    let response = language.rawobj.languageused;

                    response = response.replace(
                        "<setlanguage>", language.rawobj.commands.setlanguage);

                    raw.reply("**" + response + "**");
                }

            });

            return;
        } else if (msg == "+" + language.rawobj.commands.languages) {
            let chatString = "";
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

                let argv = msg.split(" ");
                let argc = argv.length;
                let name = "";

                // build the name string
                for (let i = 1; i < (argv.length - 4); i++) {
                    name = name + argv[i] + " ";
                }

                name = name.slice(0, -1); // remove trailing space
                let abbv = argv[argc - 4];
                let hasOT = argv[argc - 3];
                let hasNT = argv[argc - 2];
                let hasAPO = argv[argc - 1];

                let object = new Version(name, abbv, hasOT, hasNT, hasAPO);
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

                        let response = language.rawobj.versioninfo;
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
            let spaceSplit = [];
            let bookIndexes = [];
            let bookNames = [];
            let verses = {};
            let verseCount = 0;

            if (msg.includes("-")) {
                msg.split("-").forEach((item) => {
                    let tempSplit = item.split(":");

                    tempSplit.forEach((item) => {
                        let tempTempSplit = item.split(" ");

                        tempTempSplit.forEach((item) => {
                            item = item.replaceAll(/[^a-zA-Z0-9:()"'<>|\\/;*&^%$#@!.+_?=]/g, "");

                            spaceSplit.push(item);
                        });
                    });
                });
            } else {
                msg.split(":").forEach((item) => {
                    let tempSplit = item.split(" ");

                    tempSplit.forEach((item) => {
                        spaceSplit.push(item);
                    });
                });
            }

            // because of multiple verses with the same book, this
            // must be done to ensure that its not duping itself.
            for (let i = 0; i < spaceSplit.length; i++) {
                try {
                    spaceSplit[i] = spaceSplit[i].replaceAll("(", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll(")", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll("[", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll("]", "");
                    spaceSplit[i] = spaceSplit[i].replaceAll("?", "");
                    spaceSplit[i] = central.capitalizeFirstLetter(spaceSplit[i]);
                } catch (e) {
                    /* it'll probably be a number anyways, if this fails */
                }

                // TODO: Rewrite/refactor this.
                let temp = spaceSplit[i];
                switch (temp) {
                    case "Sam":
                    case "Sm":
                    case "Shmuel":
                    case "Kgs":
                    case "Melachim":
                    case "Chron":
                    case "Chr":
                    case "Cor":
                    case "Thess":
                    case "Thes":
                    case "Tim":
                    case "Tm":
                    case "Pet":
                    case "Pt":
                    case "Macc":
                    case "Mac":
                    case "Esd":
                    case "Samuel":
                    case "Kings":
                    case "Chronicles":
                    case "Esdras":
                    case "Maccabees":
                    case "Corinthians":
                    case "Thessalonians":
                    case "Timothy":
                    case "Peter":
                    case "151":
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
                        break;
                    case "Esther":
                        if ((spaceSplit[i - 1] == "Greek")) {
                                spaceSplit[i] = spaceSplit[i - 1] + temp;
                        } else {
                            continue;
                        }
                        break;
                    case "Jeremiah":
                        let isLetter = ((spaceSplit[i - 2] + spaceSplit[i - 1]) == "LetterOf");
  
                        if (isLetter) {
                            spaceSplit[i] = "LetterOfJeremiah";
                        } else {
                            continue;
                        }
                        break;
                    case "Dragon":
                        spaceSplit[i] = spaceSplit[i - 3] + spaceSplit[i - 2] +
                                        spaceSplit[i - 1] + temp;
                        break;
                    case "Men":
                    case "Youths":
                    case "Children":
                        spaceSplit[i] = spaceSplit[i - 5] + spaceSplit[i - 4] +
                                        spaceSplit[i - 3] + spaceSplit[i - 2] +
                                        spaceSplit[i - 1] + temp;
                        break;
                    case "Manasses":
                    case "Manasseh":
                    case "Solomon":
                    case "Songs":
                        spaceSplit[i] = spaceSplit[i - 2] + spaceSplit[i - 1] +
                            temp;
                        break;
                    case "John":
                    case "Jn":
                        let num = Number(spaceSplit[i - 1]);
                        let bnum = !isNaN(Number(
                            spaceSplit[i - 1]));

                        if (spaceSplit[i - 1] && bnum && !isNaN(num) &&
                            num > 0 && num < 4) {
                            spaceSplit[i] = spaceSplit[i - 1] + temp;
                        }
                        break;
                }

                let book = spaceSplit[i].replace("<", "")
                    .replace(">", "");

                if (books.ot[book.toLowerCase()]) {
                    bookNames.push(books.ot[book.toLowerCase()]);
                    bookIndexes.push(i);
                }

                if (books.nt[book.toLowerCase()]) {
                    bookNames.push(books.nt[book.toLowerCase()]);
                    bookIndexes.push(i);
                }

                if (books.apo[book.toLowerCase()]) {
                    bookNames.push(books.apo[book.toLowerCase()]);
                    bookIndexes.push(i);
                }
            }

            bookIndexes.forEach((index) => {
                let verse = [];

                // make sure that its proper verse structure
                // Book chapterNum:chapterVerse
                if (isNaN(Number(spaceSplit[index + 1])) ||
                    isNaN(Number(spaceSplit[index + 2]))) {
                    return;
                }

                if (spaceSplit[index].indexOf("<") != -1) return;

                let angleBracketIndexes = [];
                for (let i in spaceSplit) {
                    if ((i < index) && (spaceSplit[i].indexOf("<") != -1))
                        angleBracketIndexes.push(i);

                    if ((i > index) && (spaceSplit[i].indexOf(">") != -1))
                        angleBracketIndexes.push(i);
                }

                if (angleBracketIndexes.length == 2)
                    if (angleBracketIndexes[0] < index &&
                        angleBracketIndexes[1] > index)
                        return;
              
                if (spaceSplit[index] == "PrayerOfAzariah") {
                    spaceSplit[index] = "Song of The Three Young Men";
                }
                
                let book = spaceSplit[index];
                let chapter = spaceSplit[index + 1];
                let startingVerse = spaceSplit[index + 2];
              
              	try {
                    book = spaceSplit[index].replace("<", "");
                    book = book.replace(">", "");

                    chapter = spaceSplit[index + 1].replace("<", "");
                    chapter = chapter.replace(">", "");

                    startingVerse = spaceSplit[index + 2].replace("<", "");
                    startingVerse = startingVerse.replace(">", "");
                } catch(e) { /* this won't be a problem */ }

                verse.push(book);
                verse.push(chapter);
                verse.push(startingVerse);

                if (spaceSplit[index + 3] !== undefined) {
                    if (spaceSplit[index + 3].indexOf(">") != -1) return;
                    if (!isNaN(Number(spaceSplit[index + 3]))) {
                        if (Number(spaceSplit[index + 3]) >
                            Number(spaceSplit[index + 2])) {
                            let endingVerse = spaceSplit[index + 3].replace("<", "");
                            endingVerse = endingVerse.replace(">", "");
                            verse.push(endingVerse);
                        }
                    }
                }

                verses[alphabet[verseCount]] = verse;
                verseCount++;
            });

            if (verseCount > 6) {
                let responses = ["spamming me, really?", "no spam pls",
                    "no spam, am good bot", "be nice to me",
                    "don't spam me, i'm a good bot", "hey buddy, get your own " +
                    "bot to spam"
                ];
                let randomIndex = Math.floor(Math.random() * (4 - 0)) + 0;

                channel.send(responses[randomIndex]);

                central.logMessage("warn", sender, source,
                    "spam attempt - verse count: " + verseCount);
                return;
            }

            for (let i = 0; i < Object.keys(verses).length; i++) {
                let properString;
                let verse = verses[alphabet[i]];

                for (let k = 0; k < verse.length; k++) {
                    if (typeof verse[k] != "undefined") {
                        verse[k] = verse[k].replaceAll(/[^a-zA-Z0-9:]/g, "");
                    }
                }
                
                if (isNaN(Number(verse[1])) ||
                    isNaN(Number(verse[2]))) {
                    return;
                }

                if (verse.length == 4) {
                    if (isNaN(Number(verse[3]))) {
                        return;
                    }
                }

                if (verse.length < 4) {
                    properString = verse[0] + " " + verse[1] +
                        ":" + verse[2];
                } else {
                    properString = verse[0] + " " + verse[1] + ":" +
                        verse[2] + "-" + verse[3];
                }


                central.getVersion(rawSender, (data) => {
                    let version = language.defversion;
                    let headings = "enable";
                    let verseNumbers = "enable";

                    if (data) {
                        if (data[0].hasOwnProperty('version')) {
                            if (data[0].version == "HWP") version = "NRSV";
                            else version = data[0].version;
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
                                let isOT = false;
                                let isNT = false;
                                let isAPO = false;

                                for (let index in books.ot) {
                                    if (books.ot[index] == book) {
                                        isOT = true;
                                    }
                                }

                                if (!docs[0].hasOT && isOT) {
                                    central.logMessage("info", sender, source,
                                        "this sender is trying to use the OT " +
                                        "with a version that doesn't have it.");

                                    let response =
                                        language.rawobj.otnotsupported;
                                    response = response.replace(
                                        "<version>", docs[0].name);

                                    let response2 =
                                        language.rawobj.otnotsupported2;
                                    response2 = response2.replace(
                                        "<setversion>",
                                        language.rawobj.commands.setversion);

                                    channel.send(response);
                                    channel.send(response2);

                                    return;
                                }

                                for (let index in books.nt) {
                                    if (books.nt[index] == book) {
                                        isNT = true;
                                    }
                                }

                                if (!docs[0].hasNT && isNT) {
                                    central.logMessage(
                                        "info", sender, source,
                                        "this sender is trying to use the NT " +
                                        "with a version that doesn't have it.");

                                    let response =
                                        language.rawobj.ntnotsupported;
                                    response = response.replace(
                                        "<version>", docs[0].name);

                                    let response2 =
                                        language.rawobj.ntnotsupported2;
                                    response2 = response2.replace(
                                        "<setversion>",
                                        language.rawobj.commands.setversion);

                                    channel.send(response);
                                    channel.send(response2);

                                    return;
                                }

                                for (let index in books.apo) {
                                    if (books.apo[index] == book) {
                                        isAPO = true;
                                    }
                                }

                                if (!docs[0].hasAPO && isAPO) {
                                    central.logMessage(
                                        "info", sender, source,
                                        "this sender is trying to use the APO " +
                                        "with a version that doesn't have it.");

                                    let response =
                                        language.rawobj.aponotsupported;
                                    response = response.replace(
                                        "<version>", docs[0].name);

                                    let response2 =
                                        language.rawobj.aponotsupported2;
                                    response2 = response2.replace(
                                        "<setversion>",
                                        language.rawobj.commands.setversion);

                                    channel.send(response);
                                    channel.send(response2);

                                    return;
                                }
                            });

                            bibleGateway.getResult(
                                    properString, version, headings, verseNumbers)
                                .then((result) => {
                                    result.forEach((object) => {
                                        let content =
                                            "```Dust\n" + object.title + "\n\n" +
                                            object.text + "```";

                                        let responseString =
                                            "**" + object.passage + " - " +
                                            object.version + "**\n\n" + content;

                                        if (responseString.length < 2000) {
                                            central.logMessage(
                                                "info", sender, source,
                                                properString);
                                            channel.send(responseString);
                                        } else {
                                            central.logMessage(
                                                "info", sender, source, "length of " +
                                                properString +
                                                " is too long for me");
                                            channel.send(
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
            };
        }
    });
});


central.logMessage(
    "info", "global", "global", "BibleBot v" + process.env.npm_package_version +
    " by Elliott Pardee (vypr)");
bot.login(config.token);