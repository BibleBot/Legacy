const settings = require("./settings");
const central = require("./../../central");

const Version = require("./../../types/version");

const Discord = require("discord.js");

const bibleGateway = require("./../../bible-modules/bibleGateway");
const rev = require("./../../bible-modules/rev");
const kjv1611 = require("./../../bible-modules/kjv1611");

module.exports = {
    runCommand: (command, args, lang, user, callback) => {
        let embed;

        switch (command) {
            case "biblebot":
                embed = new Discord.RichEmbed();

                embed.setTitle(lang.biblebot.replace("<biblebotversion>", process.env.npm_package_version));
                embed.setDescription(lang.code);
                embed.setColor(303102);
                embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                let response = lang.commandlist;
                response = response.replace(
                    "<biblebotversion>", process.env.npm_package_version);
                response = response.replace(
                    "<search>", lang.commands.search);
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
                response = response.replace(
                    "<supporters>", lang.commands.supporters);
                response = response.replaceAll(
                    "* ", "");

                embed.addField(lang.commandlistName, response + "\n\n**" + lang.usage + "**");
                embed.addBlankField();
                embed.addField(lang.links, lang.patreon + "\n" + lang.joinserver + "\n" + lang.copyright);

                return callback({ level: "info", message: embed });
            case "search":
                settings.versions.getVersions((availableVersions) => {
                    settings.versions.getVersion(user, (data) => {
                        let version;
                        let query = "";

                        if (data) {
                            if (data[0].hasOwnProperty('version')) {
                                if (data[0].version === "HWP") {
                                    version = "NRSV";
                                } else {
                                    version = data[0].version;
                                }
                            }
                        }

                        if (availableVersions.indexOf(args[0]) > -1) {
                            version = args[0];

                            for (const i in args) {
                                if (i !== 0) {
                                    query += args[i] + " ";
                                }
                            }
                        } else {
                            for (const i in args) {
                                query += args[i] + " ";
                            }
                        }

                        if (version !== "KJV1611" && version !== "REV") {
                            bibleGateway.search(version, query).then((result) => {
                                let query = "";

                                for (const index in args) {
                                    query += args[index] + " ";
                                }

                                query = query.replaceAll("\"", "");

                                const pages = [];
                                let totalPages = Math.ceil(Object.keys(result).length / 5);

                                if (totalPages === 0) {
                                    totalPages++;
                                }

                                for (let i = 0; i < totalPages; i++) {
                                    embed = new Discord.RichEmbed();

                                    embed.setTitle(lang.searchResults + " \"" + query.slice(0, -1) + "\"");
                                    embed.setDescription(lang.page + " " + (pages.length + 1) + " " + lang.of + " " + totalPages);
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
                                        embed.setTitle(lang.nothingFound.replace("<query>", query.slice(0, -1)));
                                    }

                                    pages.push(embed);
                                }

                                if (pages.length > 1) {
                                    return callback({ level: "info", paged: true, pages: pages });
                                } else {
                                    return callback({ level: "err", message: pages[0] });
                                }
                            }).catch((err) => {
                                callback(err);
                            });
                        } else {
                            return callback({ level: "err", message: lang.searchNotSupported.replace("<search>", lang.commands.search) });
                        }
                    });
                });
                break;
            case "setversion":
                settings.versions.setVersion(user, args[0], (data) => {
                    embed = new Discord.RichEmbed();
                    embed.setColor(303102);
                    embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                    if (data) {
                        embed.addField("+" + lang.commands.setversion, lang.setversionsuccess);

                        return callback({
                            level: "info",
                            message: embed
                        });
                    } else {
                        embed.setColor("#ff2e2e");
                        embed.addField("+" + lang.commands.setversion, lang.setversionfail.replace("<versions>", lang.commands.versions));

                        return callback({
                            level: "err",
                            message: embed
                        });
                    }
                });
                break;
            case "version":
                settings.versions.getVersion(user, (data) => {
                    embed = new Discord.RichEmbed();
                    embed.setColor(303102);
                    embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

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

                            embed.addField("+" + lang.commands.version, response);

                            return callback({
                                level: "info",
                                message: embed
                            });
                        } else {
                            let response = lang.noversionused;

                            response = response.replace(
                                "<setversion>", lang.commands.setversion);

                            embed.setColor("#ff2e2e");
                            embed.addField("+" + lang.commands.version, response);

                            return callback({
                                level: "err",
                                message: embed
                            });
                        }
                    } else {
                        let response = lang.noversionused;

                        response = response.replace(
                            "<setversion>", lang.commands.setversion);

                        embed.setColor("#ff2e2e");
                        embed.addField("+" + lang.commands.version, response);

                        return callback({
                            level: "err",
                            message: embed
                        });
                    }
                });
                break;
            case "versions":
                settings.versions.getVersions((availableVersions) => {
                    const pages = [];
                    const maxResultsPerPage = 25;
                    let totalPages = Math.ceil(availableVersions.length / maxResultsPerPage);

                    if (totalPages === 0) {
                        totalPages++;
                    }

                    for (let i = 0; i < totalPages; i++) {
                        embed = new Discord.RichEmbed();

                        embed.setColor(303102);
                        embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                        if (availableVersions.length > 0) {
                            let count = 0;
                            let list = "";

                            for (const key in availableVersions) {
                                if (count < maxResultsPerPage) {
                                    list += availableVersions[key] + "\n";
                                    delete availableVersions[key];
                                    count++;
                                }
                            };

                            embed.addField("+" + lang.commands.versions + " - " + lang.page + " " + (pages.length + 1) + " " + lang.of + " " + totalPages,
                                list);

                            pages.push(embed);
                        }
                    }

                    return callback({
                        level: "info",
                        paged: true,
                        pages: pages
                    });
                });
                break;
            case "versioninfo":
                central.versionDB.find({
                    "abbv": args[0]
                }, (err, data) => {
                    data = data; // for some reason it won't initialize properly

                    embed = new Discord.RichEmbed();

                    embed.setColor(303102);
                    embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");


                    if (err) {
                        embed.setColor("#ff2e2e");
                        embed.addField("+" + lang.commands.versioninfo, lang.versioninfofailed);

                        return callback({
                            level: "err",
                            message: embed
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

                        embed.addField("+" + lang.commands.versioninfo, response);

                        return callback({
                            level: "info",
                            message: embed
                        });
                    } else {
                        embed.setColor("#ff2e2e");
                        embed.addField("+" + lang.commands.versioninfo, lang.versioninfofailed);

                        return callback({
                            level: "err",
                            message: embed
                        });
                    }
                });
                break;
            case "setlanguage":
                settings.languages.setLanguage(user, args[0], (data) => {
                    embed = new Discord.RichEmbed();

                    embed.setColor(303102);
                    embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                    if (data) {
                        embed.addField("+" + lang.commands.setlanguage, lang.setlanguagesuccess);

                        return callback({
                            level: "info",
                            message: embed
                        });
                    } else {
                        embed.setColor("#ff2e2e");
                        embed.addField("+" + lang.commands.setlanguage, lang.setlanguagefail.replace("<languages>", lang.commands.languages));

                        return callback({
                            level: "err",
                            message: embed
                        });
                    }
                });
                break;
            case "language":
                settings.languages.getLanguage(user, () => {
                    embed = new Discord.RichEmbed();

                    embed.setColor(303102);
                    embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                    let response = lang.languageused;

                    response = response.replace(
                        "<setlanguage>", lang.commands.setlanguage);

                    embed.addField("+" + lang.commands.language, response);

                    return callback({
                        level: "info",
                        message: embed
                    });
                });
                break;
            case "languages":
                settings.languages.getLanguages((availableLanguages) => {
                    embed = new Discord.RichEmbed();

                    embed.setColor(303102);
                    embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                    let chatString = "";

                    for (let i in availableLanguages) {
                        chatString += availableLanguages[i].name + " [`" +
                            availableLanguages[i].objectName + "`], ";
                    }

                    embed.addField("+" + lang.commands.languages, chatString.replaceAll(", ", "\n"));

                    return callback({
                        level: "info",
                        message: embed
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

                    if (version !== "KJV1611" && version !== "REV") {
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
                    } else if (version === "REV") {
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
                    } else {
                        kjv1611.getVOTD(version, headings, verseNumbers)
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

                    if (version !== "KJV1611" && version !== "REV") {
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
                    } else if (version === "REV") {
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
                    } else {
                        kjv1611.getRandomVerse(version, headings, verseNumbers)
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
                        embed = new Discord.RichEmbed();

                        embed.setColor(303102);
                        embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                        if (data) {
                            embed.addField("+" + lang.commands.headings, lang.headingssuccess);

                            return callback({ level: "info", message: embed });
                        } else {
                            embed.setColor("#ff2e2e");

                            const response = lang.headingsfail.replaceAll("<headings>", lang.commands.headings)
                                .replace("<enable>", lang.arguments.enable).replace("<disable>", lang.arguments.disable);

                            embed.addField("+" + lang.commands.headings, response);

                            return callback({
                                level: "err",
                                message: embed
                            });
                        }
                    });
                } else {
                    settings.formatting.getHeadings(user, (data) => {
                        embed = new Discord.RichEmbed();

                        embed.setColor(303102);
                        embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                        if (data === "enable") {
                            const response = lang.headings.replace("<enabled/disabled>", lang.enabled);
                            embed.addField("+" + lang.commands.headings, response);

                            return callback({ level: "info", message: embed });
                        } else {
                            const response = lang.headings.replace("<enabled/disabled>", lang.disabled);
                            embed.addField("+" + lang.commands.headings, response);

                            return callback({ level: "info", message: embed });
                        }
                    });
                }
                break;
            case "versenumbers":
                if (args.length === 1) {
                    settings.formatting.setVerseNumbers(user, args[0], (data) => {
                        embed = new Discord.RichEmbed();

                        embed.setColor(303102);
                        embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                        if (data) {
                            embed.addField("+" + lang.commands.versenumbers, lang.versenumberssuccess);

                            return callback({ level: "info", message: embed });
                        } else {
                            embed.setColor("#ff2e2e");

                            const response = lang.versenumbersfail.replaceAll("<versenumbers>", lang.commands.versenumbers)
                                .replace("<enable>", lang.arguments.enable).replace("<disable>", lang.arguments.disable);

                            embed.addField("+" + lang.commands.versenumbers, response);

                            return callback({
                                level: "err",
                                message: embed
                            });
                        }
                    });
                } else {
                    settings.formatting.getVerseNumbers(user, (data) => {
                        embed = new Discord.RichEmbed();

                        embed.setColor(303102);
                        embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                        if (data === "enable") {
                            const response = lang.versenumbers.replace("<enabled/disabled>", lang.enabled);
                            embed.addField("+" + lang.commands.versenumbers, response);

                            return callback({ level: "info", message: embed });
                        } else {
                            const response = lang.versenumbers.replace("<enabled/disabled>", lang.disabled);
                            embed.addField("+" + lang.commands.versenumbers, response);

                            return callback({ level: "info", message: embed });
                        }
                    });
                }
                break;
            case "users":
                embed = new Discord.RichEmbed();

                embed.setColor(303102);
                embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                let processed = 0;

                args[0].shard.fetchClientValues("users.size").then((results) => {
                    processed = (results.reduce((prev, val) => prev + val, 0) - 1).toString();
                    embed.addField("+" + lang.commands.users, lang.users + ": " + processed.toString());

                    return callback({
                        level: "info",
                        message: embed
                    });
                });
                break;
            case "servers":
                embed = new Discord.RichEmbed();

                embed.setColor(303102);
                embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                let count;

                args[0].shard.fetchClientValues("guilds.size").then((results) => {
                    count = results.reduce((prev, val) => prev + val, 0).toString();
                    embed.addField("+" + lang.commands.servers, lang.servers.replace("<count>", count));

                    return callback({
                        level: "info",
                        message: embed
                    });
                });
                break;
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
                embed = new Discord.RichEmbed();

                embed.setColor(303102);
                embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

                embed.addField("+" + lang.commands.supporters, "A special thank you to CHAZER2222, Jepekula, Joseph, Soku, and anonymous donors for financially supporting BibleBot! <3");

                return callback({
                    level: "info",
                    message: embed
                });
            case "invite":
                return callback({
                    level: "info",
                    message: "<https://discordapp.com/oauth2/authorize?client_id=361033318273384449&scope=bot&permissions=0>"
                });
        }
    },

    runOwnerCommand: (command, args, lang, callback) => {
        let embed;
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
                    message: m.slice(0, -1)
                });
            case "addversion":
                embed = new Discord.RichEmbed();

                embed.setColor(303102);
                embed.setFooter("BibleBot v" + process.env.npm_package_version, "https://cdn.discordapp.com/avatars/361033318273384449/5aad77425546f9baa5e4b5112696e10a.png");

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
                        embed.setColor("#ff2e2e");
                        embed.addField("+" + lang.commands.addversion, lang.addversionfail);

                        return callback({ level: "err", message: embed });
                    } else {
                        embed.addField("+" + lang.commands.addversion, lang.addversionsuccess);
                        return callback({ level: "info", message: embed });
                    }
                });
        }
    }
};