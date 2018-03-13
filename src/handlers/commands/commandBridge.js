import settings from "./settings";
import central from "../../central";

import Version from "../../types/version";

import * as bibleGateway from "../../bible-modules/bibleGateway";
import * as rev from "../../bible-modules/rev";

export function runCommand(command, args, lang, user, callback) {
    switch (command) {
        case "biblebot":
            let response = lang.biblebot;
            response = response.replace(
                "<biblebotversion>", process.env.npm_package_version);
            response = response.replace(
                "<setversion>", lang.commands.setversion);
            response = response.replace(
                "<version>", lang.commands.version);
            response = response.replace(
                "<versions>", lang.commands.versions);
            response = response.replace(
                "<versioninfo>", lang.commands.versioninfo);
            response = response.replace(
                "<votd>", lang.commands.votd);
            response = response.replace(
                "<verseoftheday>", lang.commands.verseoftheday);
            response = response.replace(
                "<random>", lang.commands.random);
            response = response.replace(
                "<versenumbers>", lang.commands.versenumbers);
            response = response.replace(
                "<headings>", lang.commands.headings);
            response = response.replace(
                "<setlanguage>", lang.commands.setlanguage);
            response = response.replace(
                "<language>", lang.commands.language);
            response = response.replace(
                "<languages>", lang.commands.languages);
            response = response.replaceAll(
                "<enable>", lang.arguments.enable);
            response = response.replaceAll(
                "<disable>", lang.arguments.disable);
            response = response.replace(
                "<users>", lang.commands.users);
            response = response.replace(
                "<servers>", lang.commands.servers);
            response = response.replace(
                "<invite>", lang.commands.invite);

            response += "\n\n---\n";

            let second = "**" + lang.patreon + "**";
            second += "\n---\n\n" + lang.joinserver + "\n" + lang.copyright;;

            return callback({ level: "info", twoMessages: true, first: response, second: second });
        case "setversion":
            settings.versions.setVersion(user, args[0], (data) => {
                if (data) {
                    return callback({
                        level: "info",
                        message: "**" + lang.setversionsuccess + "**"
                    });
                } else {
                    return callback({
                        level: "err",
                        message: "**" + lang.setversionfail + "**"
                    });
                }
            });
            break;
        case "version":
            settings.versions.getVersion(user, (data) => {
                if (data) {
                    if (data[0].version) {
                        if (data[0].version === "HWP") {
                            data[0].version = "NRSV";
                        }

                        let response = lang.versionused;

                        response = response.replace(
                            "<version>", data[0].version);
                        response = response.replace(
                            "<setversion>", lang.commands.setversion);

                        return callback({
                            level: "info",
                            message: "**" + response + ".**"
                        });
                    } else {
                        let response = lang.noversionused;

                        response = response.replace(
                            "<setversion>", lang.commands.setversion);

                        return callback({
                            level: "err",
                            message: "**" + response + "**"
                        });
                    }
                } else {
                    let response = lang.noversionused;

                    response = response.replace(
                        "<setversion>", lang.commands.setversion);

                    return callback({
                        level: "err",
                        message: "**" + response + "**"
                    });
                }
            });
            break;
        case "versions":
            settings.versions.getVersions((availableVersions) => {
                let chatString = "";

                for (let i in availableVersions) {
                    chatString += availableVersions[i] + ", ";
                }

                return callback({
                    level: "info",
                    message: "**" + lang.versions + ":**\n```" +
                        chatString.slice(0, -2) + "```"
                });
            });
            break;
        case "versioninfo":
            central.versionDB.find({
                "abbv": args[0]
            }, (err, data) => {
                data = data; // for some reason it won't initialize properly

                if (err) {
                    return callback({
                        level: "err",
                        message: "**" + lang.versioninfofailed + "**"
                    });
                } else if (data.length > 0) {
                    let response = lang.versioninfo;
                    response = response.replace("<versionname>", data[0].name);

                    if (data[0].hasOT === true) {
                        response = response.replace("<hasOT>", lang.arguments.yes);
                    } else {
                        response = response.replace("<hasOT>", lang.arguments.no);
                    }

                    if (data[0].hasNT === true) {
                        response = response.replace("<hasNT>", lang.arguments.yes);
                    } else {
                        response = response.replace("<hasNT>", lang.arguments.no);
                    }

                    if (data[0].hasAPO === true) {
                        response = response.replace("<hasAPO>", lang.arguments.yes);
                    } else {
                        response = response.replace("<hasAPO>", lang.arguments.no);
                    }

                    return callback({
                        level: "info",
                        message: response
                    });
                } else {
                    return callback({
                        level: "err",
                        message: "**" + lang.versioninfofailed + "**"
                    });
                }
            });
            break;
        case "setlanguage":
            settings.languages.setLanguage(user, args[0], (data) => {
                if (data) {
                    return callback({
                        level: "info",
                        message: "**" + lang.setlanguagesuccess + "**"
                    });
                } else {
                    return callback({
                        level: "err",
                        message: "**" + lang.setlanguagefail + "**"
                    });
                }
            });
            break;
        case "language":
            settings.languages.getLanguage(user, () => {
                let response = lang.languageused;

                response = response.replace(
                    "<setlanguage>", lang.commands.setlanguage);

                return callback({
                    level: "info",
                    message: "**" + response + "**"
                });
            });
            break;
        case "languages":
            settings.languages.getLanguages((availableLanguages) => {
                let chatString = "";

                for (let i in availableLanguages) {
                    chatString += availableLanguages[i].name + " [" +
                        availableLanguages[i].object_name + "], ";
                }

                return callback({
                    level: "info",
                    message: "**" + lang.versions + ":**\n```" +
                        chatString.slice(0, -2) + "```"
                });
            });
            break;
        case "votd":
        case "verseoftheday":
            settings.versions.getVersion(user, (data) => {
                // TODO: modify what (lang) passes
                // so that i can properly do
                // lang.getDefaultVersion();
                let version = "NRSV";
                let headings = "enable";
                let verseNumbers = "enable";

                if (data) {
                    if (data[0].hasOwnProperty('version')) {
                        if (data[0].version === "HWP") {
                            version = "NRSV";
                        } else {
                            version = data[0].version;
                        }
                    }
                    if (data[0].hasOwnProperty('headings')) {
                        headings = data[0].headings;
                    }
                    if (data[0].hasOwnProperty('verseNumbers')) {
                        verseNumbers = data[0].verseNumbers;
                    }
                }

                if (version !== "REV") {
                    bibleGateway.getVOTD(version, headings, verseNumbers)
                        .then((result) => {
                            if (result === "too long") {
                                return callback({
                                    level: "err",
                                    message: lang.passagetoolong
                                });
                            }

                            return callback({
                                level: "info",
                                message: result
                            });
                        });
                } else {
                    rev.getVOTD(version, headings, verseNumbers)
                        .then((result) => {
                            if (result === "too long") {
                                return callback({
                                    level: "err",
                                    message: lang.passagetoolong
                                });
                            }

                            return callback({
                                level: "info",
                                message: result
                            });
                        });
                }
            });
            break;
        case "random":
            settings.versions.getVersion(user, (data) => {
                // TODO: modify what (lang) passes
                // so that i can properly do
                // lang.getDefaultVersion();
                let version = "NRSV";
                let headings = "enable";
                let verseNumbers = "enable";

                if (data) {
                    if (data[0].hasOwnProperty('version')) {
                        if (data[0].version === "HWP") {
                            version = "NRSV";
                        } else {
                            version = data[0].version;
                        }
                    }
                    if (data[0].hasOwnProperty('headings')) {
                        headings = data[0].headings;
                    }
                    if (data[0].hasOwnProperty('verseNumbers')) {
                        verseNumbers = data[0].verseNumbers;
                    }
                }

                if (version !== "REV") {
                    bibleGateway.getRandomVerse(version, headings, verseNumbers)
                        .then((result) => {
                            if (result === "too long") {
                                return callback({
                                    level: "err",
                                    message: lang.passagetoolong
                                });
                            }

                            return callback({
                                level: "info",
                                message: result
                            });
                        });
                } else {
                    rev.getRandomVerse(version, headings, verseNumbers)
                        .then((result) => {
                            if (result === "too long") {
                                return callback({
                                    level: "err",
                                    message: lang.passagetoolong
                                });
                            }

                            return callback({
                                level: "info",
                                message: result
                            });
                        });
                }
            });
            break;
        case "headings":
            if (args.length === 1) {
                settings.formatting.setHeadings(user, args[0], (data) => {
                    if (data) {
                        return callback({ level: "info", message: "**" + lang.headingssuccess + "**" });
                    } else {
                        return callback({ level: "err", message: "**" + lang.headingsfail + "**" });
                    }
                });
            } else {
                settings.formatting.getHeadings(user, (data) => {
                    if (data === "enable") {
                        const response = lang.headings.replace("<enabled/disabled>", lang.enabled);
                        return callback({ level: "info", message: "**" + response + "**" });
                    } else {
                        const response = lang.headings.replace("<enabled/disabled>", lang.disabled);
                        return callback({ level: "info", message: "**" + response + "**" });
                    }
                });
            }
            break;
        case "versenumbers":
            if (args.length === 1) {
                settings.formatting.setVerseNumbers(user, args[0], (data) => {
                    if (data) {
                        return callback({ level: "info", message: "**" + lang.versenumberssuccess + "**" });
                    } else {
                        return callback({ level: "err", message: "**" + lang.versenumbersfail + "**" });
                    }
                });
            } else {
                settings.formatting.getVerseNumbers(user, (data) => {
                    if (data === "enable") {
                        const response = lang.versenumbers.replace("<enabled/disabled>", lang.enabled);
                        return callback({ level: "info", message: "**" + response + "**" });
                    } else {
                        const response = lang.versenumbers.replace("<enabled/disabled>", lang.disabled);
                        return callback({ level: "info", message: "**" + response + "**" });
                    }
                });
            }
            break;
        case "users":
            let users = args[0].users;
            let processed = 0;

            users.forEach((value) => {
                if (!value.bot) {
                    processed++;
                }
            });

            return callback({
                level: "info",
                message: lang.users + ": " + processed.toString()
            });
        case "servers":
            const count = args[0].guilds.size.toString();
            return callback({
                level: "info",
                message: lang.servers.replace("<count>", count)
            });
        case "jepekula":
            settings.versions.getVersion(user, (data) => {
                // see TODO for votd and random
                let version = "NRSV";
                let headings = "enable";
                let verseNumbers = "enable";

                if (data) {
                    if (data[0].hasOwnProperty('version')) {
                        if (data[0].version === "HWP") {
                            version = "NRSV";
                        } else {
                            version = data[0].version;
                        }
                    }
                    if (data[0].hasOwnProperty('headings')) {
                        headings = data[0].headings;
                    }
                    if (data[0].hasOwnProperty('verseNumbers')) {
                        verseNumbers = data[0].verseNumbers;
                    }
                }

                if (version !== "REV") {
                    bibleGateway.getResult(
                            "Mark 9:23-24", version, headings, verseNumbers)
                        .then((result) => {
                            result.forEach((object) => {
                                const content =
                                    "```Dust\n" + object.title + "\n\n" +
                                    object.text + "```";

                                const responseString =
                                    "**" + object.passage + " - " +
                                    object.version + "**\n\n" + content;

                                if (responseString.length < 2000) {
                                    return callback({
                                        level: "info",
                                        twoMessages: false,
                                        reference: "Mark 9:23-24",
                                        message: responseString
                                    });
                                } else if (responseString.length > 2000 && responseString.length < 3500) {
                                    const splitText = central.splitter(object.text);

                                    const content1 = "```Dust\n" + object.title + "\n\n" + splitText.first + "```";
                                    const responseString1 = "**" + object.passage + " - " + object.version + "**\n\n" + content1;
                                    const content2 = "```Dust\n " + splitText.second + "```";

                                    return callback({
                                        level: "info",
                                        twoMessages: true,
                                        reference: "Mark 9:23-24",
                                        firstMessage: responseString1,
                                        secondMessage: content2
                                    });
                                } else {
                                    return callback({
                                        level: "err",
                                        twoMessages: false,
                                        reference: "Mark 9:23-24",
                                        message: lang.passagetoolong
                                    });
                                }
                            });
                        }).catch((err) => callback(err));
                } else {
                    rev.getResult("Mark 9:23-24", version, headings, verseNumbers)
                        .then((result) => {
                            result.forEach((object) => {
                                const content =
                                    "```Dust\n" + object.title + "\n\n" +
                                    object.text + "```";

                                const responseString =
                                    "**" + object.passage + " - " +
                                    object.version + "**\n\n" + content;

                                if (responseString.length < 2000) {
                                    return callback({
                                        level: "info",
                                        twoMessages: false,
                                        reference: "Mark 9:23-24",
                                        message: responseString
                                    });
                                } else if (responseString.length > 2000 && responseString.length < 3500) {
                                    const splitText = central.splitter(object.text);

                                    const content1 = "```Dust\n" + object.title + "\n\n" + splitText.first + "```";
                                    const responseString1 = "**" + object.passage + " - " + object.version + "**\n\n" + content1;
                                    const content2 = "```Dust\n " + splitText.second + "```";

                                    return callback({
                                        level: "info",
                                        twoMessages: true,
                                        reference: "Mark 9:23-24",
                                        firstMessage: responseString1,
                                        secondMessage: content2
                                    });
                                } else {
                                    return callback({
                                        level: "err",
                                        twoMessages: false,
                                        reference: "Mark 9:23-24",
                                        message: lang.passagetoolong
                                    });
                                }
                            });
                        }).catch((err) => callback(err));
                }
            });
            break;
        case "joseph":
            return callback({
                level: "info",
                message: "Jesus never consecrated peanut butter and jelly sandwiches and Coca-Cola!"
            });
        case "supporters":
            return callback({
                level: "info",
                message: "A special thank you to CHAZER2222, Jepekula, Joseph, Soku, and anonymous donors for financially supporting BibleBot! <3"
            });
        case "invite":
            return callback({
                level: "info",
                message: "https://discordapp.com/oauth2/authorize?client_id=361033318273384449&scope=bot&permissions=0"
            });
    }
}

export function runOwnerCommand(command, args, lang, callback) {
    switch (command) {
        case "puppet":
            let message = "";
            for (const argument in args) {
                message += args[argument] + " ";
            }

            return callback({
                level: "info",
                message: message
            });
        case "eval":
            let msg = "";
            for (const argument in args) {
                msg += args[argument] + " ";
            }

            try {
                return callback({
                    level: "info",
                    message: eval(msg)
                });
            } catch (e) {
                return callback({
                    level: "err",
                    message: "error - " + e.message
                });
            }
        case "announce":
            let m = "";
            for (const argument in args) {
                m += args[argument] + " ";
            }

            return callback({
                level: "info",
                announcement: true,
                message: m
            });
        case "addversion":
            let argc = args.length;
            let name = "";

            // build the name string
            for (let i = 0; i < (argc - 4); i++) {
                name = name + args[i] + " ";
            }

            name = name.slice(0, -1); // remove trailing space
            let abbv = args[argc - 4];
            let hasOT = args[argc - 3];
            let hasNT = args[argc - 2];
            let hasAPO = args[argc - 1];

            let newVersion = new Version(name, abbv, hasOT, hasNT, hasAPO);
            central.versionDB.insert(newVersion.toObject(), (err) => {
                if (err) {
                    return callback({ level: "err", message: "**" + lang.addversionfail + "**" });
                } else {
                    return callback({ level: "info", message: "**" + lang.addversionsuccess + "**" });
                }
            });
    }
}
