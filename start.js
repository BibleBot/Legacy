// Discord API
var Discord = require("discord.js");
var bot = new Discord.Client();
var request = require("request");

// For user version preferences
var dataStore = require("nedb");
var db = new dataStore({ filename: 'db', autoload: true, corruptAlertThreshold: 1 });

// Version database
var versionDB = new dataStore({filename: 'versiondb', autoload: true });

var globals = {};

// for async calls
var async = require("async");

// Other stuff
var books = require("./books");
var Version = require("./version");
var bibleGateway = require("./bibleGateway");

// for getRandomVerse
var cheerio = require("cheerio");

// for logging
var log4js = require('log4js');
log4js.configure({ appenders: [
    { type: "console" },
    { type: "dateFile", filename: "logs/loggerrino.log", pattern: "-yyyy-MM-dd", alwaysIncludePattern: false }
]});

var logger = log4js.getLogger();

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function setGlobal(item, value) {
    global[item] = value;
}

function getGlobal(item) {
    return global[item];
}

function getRandomVerse(version) {
    var url = "https://dailyverses.net/random-bible-verse";

    var promise = new Promise( (resolve, reject) => {
        request(url, function (err, resp, body) {
            if (err != null) {
                reject(err);
            }

            var $ = cheerio.load(body);
            verse = $(".bibleChapter a").first().text();

            bibleGateway.getResult(verse, version).then(function (result) {
                result.forEach(function (object) {
                    var purifiedObjectText = object.text.replaceAll("“", " \"")
                                                        .replaceAll("[", " [")
                                                        .replaceAll("]", "] ")
                                                        .replaceAll("”", "\" ")
                                                        .replaceAll("‘", "'")
                                                        .replaceAll("’", "'")
                                                        .replaceAll(",", ", ")
                                                        .replaceAll(".", ". ")
                                                        .replaceAll(". \"", ".\"")
                                                        .replaceAll(". '", ".'")
                                                        .replaceAll(", \"", ",\"")
                                                        .replaceAll(", '", ",'")
                                                        .replaceAll("!", "! ")
                                                        .replaceAll("! \"", "!\"")
                                                        .replaceAll("! '", "!'")
                                                        .replaceAll("?", "? ")
                                                        .replaceAll("? \"", "?\"")
                                                        .replaceAll("? '", "?'")
                                                        .replaceAll(/\s+/g, ' ');

                    var content = "```" + object.title + "\n\n" + purifiedObjectText + "```";
                    var responseString = "**" + object.passage + " - " + object.version + "**\n\n" + content;

                    if (responseString.length < 2000) {
                        resolve(responseString);
                    } else {
                        getRandomVerse(version);
                    }
                });
            }).catch(function (err) {
                logMessage("err", "global", "bibleGateway", err);
            });
        });
    });

    return promise;
}

function getVOTD(version) {
    var url = "https://www.biblegateway.com/reading-plans/verse-of-the-day/next";

    var promise = new Promise( (resolve, reject) => {
        request(url, function (err, resp, body) {
            if (err != null) {
                reject(err);
            }

            var $ = cheerio.load(body);
            verse = $(".rp-passage-display").text();

            bibleGateway.getResult(verse, version).then(function (result) {
                result.forEach(function (object) {
                    var purifiedObjectText = object.text.replaceAll("“", " \"")
                                                        .replaceAll("[", " [")
                                                        .replaceAll("]", "] ")
                                                        .replaceAll("”", "\" ")
                                                        .replaceAll("‘", "'")
                                                        .replaceAll("’", "'")
                                                        .replaceAll(",", ", ")
                                                        .replaceAll(".", ". ")
                                                        .replaceAll(". \"", ".\"")
                                                        .replaceAll(". '", ".'")
                                                        .replaceAll(", \"", ",\"")
                                                        .replaceAll(", '", ",'")
                                                        .replaceAll("!", "! ")
                                                        .replaceAll("! \"", "!\"")
                                                        .replaceAll("! '", "!'")
                                                        .replaceAll("?", "? ")
                                                        .replaceAll("? \"", "?\"")
                                                        .replaceAll("? '", "?'")
                                                        .replaceAll(/\s+/g, ' ');

                    var content = "```" + object.title + "\n\n" + purifiedObjectText + "```";
                    var responseString = "**" + object.passage + " - " + object.version + "**\n\n" + content;

                    if (responseString.length < 2000) {
                        resolve(responseString);
                    } else {
                        getVOTD(version);
                    }
                });
            }).catch(function (err) {
                logMessage("err", "global", "bibleGateway", err);
            });
        });
    });

    return promise;
}

function logMessage(level, sender, channel, message) {
    var content = "<" + sender + "@" + channel + "> " + message;
    switch (level) {
        case "info":
            logger.info(content);
            break;
        case "err":
            logger.error(content);
            break;
        case "warn":
            logger.warn(content);
            break;
    }
}

function setVersion(user, version, callback) {
    var version = version.toUpperCase();

    versionDB.find({"abbv": version}, function (err, docs) {
        if (docs.length == 0) { return callback(null); }
        db.find({"user": user}, function (err, doc) {
            if (doc.length > 0) {
                db.update({"user": user}, {$set: {"version":version}}, {"multi": true}, function (err, docs) {
                    return callback(docs);
                });
            } else {
                db.insert({"user": user,"version":version}, function (err, docs) {
                    return callback(docs);
                });
            }
        });
    });
}

function getVersion(user, callback) {
    db.find({"user": user}, function (err, docs) {
        if (docs.length > 0) {
            return callback(docs);
        } else {
            return callback(null);
        }
    });
}

bot.on("ready", () => {
    logMessage("info", "global", "global", "connected");
});


bot.on("reconnecting", () => {
    logMessage("info", "global", "global", "attempting to reconnect");
});

bot.on("disconnect", () => {
    logMessage("info", "global", "global", "disconnected");
});

bot.on("warning", warn => {
    logMessage("warn", "global", "global", warn);
});

bot.on("error", e => {
    logMessage("err", "global", "global", e);
});

bot.on("message", raw => {
    // taking the raw message object and making it more usable
    var server = raw.server;
    var sender = raw.author.username + "#" + raw.author.discriminator;
    var channel = raw.channel;
    var msg = raw.content;
    var source;

    if ((typeof channel.guild != "undefined") && (typeof channel.name != "undefined")) {
        source = channel.guild.name + "#" + channel.name;
    } else { source = "unknown"; }

    if (sender == "BibleBot#0842" || sender == "Cathobot#6788") return;
    if (source.includes("Discord Bots") && sender != "UnimatrixZeroOne#7501") return;

    // for verse arrays
    var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
                    "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x",
                    "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
                    "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
                    "W", "X", "Y", "Z"];

    if (msg.startsWith("+eval") && sender == "UnimatrixZeroOne#7501") {
        logMessage("info", sender, source, "+eval");
        try {
            eval(msg.replaceAll("+eval ", ""));
        } catch(e) {
            // do nothing
        }
    } else if (msg.startsWith("+leave") && sender == "UnimatrixZeroOne#7501") {
        logMessage("info", sender, source, "+leave");
        try {
            
            server.leave();
        } catch(e) {
            // do nothing
        }
    } else if (msg.startsWith("+setGlobal") && sender == "UnimatrixZeroOne#7501") {
        logMessage("info", sender, source, "+setGlobal");
        var item = msg.split(" ")[1];
        var value = msg.replaceAll("+setGlobal " + item + " ", "");
        setGlobal(item, value)

        channel.sendMessage("set");
    } else if (msg.startsWith("+getGlobal") && sender == "UnimatrixZeroOne#7501") {
        logMessage("info", sender, source, "+getGlobal");
        channel.sendMessage(getGlobal(msg.replaceAll("+getGlobal ", "")));
    } else if (msg.startsWith("+puppet") && sender == "UnimatrixZeroOne#7501") {
        raw.delete();
        logMessage("info", sender, source, "+puppet");
        channel.sendMessage(msg.replaceAll("+puppet ", ""));
    } else if (msg == "+holybot") {
        logMessage("info", sender, source, "+holybot");
        channel.sendMessage("**HolyBot by Elliott Pardee (vipr#4035)** - code: https://github.com/vypr/holybot-dc\n\n```commands:\n* `+setversion ABBV` - set preferred version to ABBV\n* `+version` - see what version you've set\n* `+versions` - see the supported versions\n* `+random` - get a random Bible verse\n* `+verseoftheday` (`+votd`) - get the verse of the day```\n**To use it, just say a Bible verse. I'll handle the rest. :smiley:**");
    } else if (msg == "+random") {
        getVersion(sender, function (data) {
            var version = "ESV";

            if (data) {
                version = data[0].version;
            }

            getRandomVerse(version).then(function (result) {
                logMessage("info", sender, source, "+random");
                channel.sendMessage(result);
            });
        });
    } else if (msg == "+verseoftheday" || msg == "+votd") {
        getVersion(sender, function (data) {
            var version = "ESV";

            if (data) {
                version = data[0].version;
            }

            getVOTD(version).then(function (result) {
                logMessage("info", sender, source, "+votd");
                channel.sendMessage(result);
            });
        });
    } else if (msg.startsWith("+setversion")) {
        if (msg.split(" ").length != 2) {
            versionDB.find({}, function (err, docs) {
                var chatString = "";
                for (i in docs) {
                    chatString += docs[i].abbv + ", ";
                }

                logMessage("info", sender, source, "empty +setversion sent");
                raw.reply("**I support:**\n\n```" + chatString.slice(0, -2) + "```");
            });
            return;
        } else {
            setVersion(sender, msg.split(" ")[1], function (data) {
                if (data) {
                    logMessage("info", sender, source, "+setversion " + msg.split(" ")[1]);
                    raw.reply("**Set version successfully.**");
                } else {
                    versionDB.find({}, function (err, docs) {
                        var chatString = "";
                        for (i in docs) {
                            chatString += docs[i].abbv + ", ";
                        }

                        logMessage("info", sender, source, "failed +setversion");
                        raw.reply("**Failed to set version, I only support:**\n\n```" + chatString.slice(0, -2) + "```");
                    });
                }
            });
        }

        return;
    } else if (msg == "+version") {
        getVersion(sender, function (data) {
            logMessage("info", sender, source, "+version");
            if (data) {
                raw.reply("**You are using " + data[0].version + ". Use `+setversion` to set a different version.**");
            } else {
                raw.reply("**I couldn't find your name in my database, have you used `+setversion` yet?**");
            }
        });

        return;
    } else if (msg == "+versions") {
        versionDB.find({}, function (err, docs) {
            var chatString = "";
            for (i in docs) {
                chatString += docs[i].abbv + ", ";
            }

            logMessage("info", sender, source, "+versions");
            raw.reply("**I support:**\n\n```" + chatString.slice(0, -2) + "```");
        });
    } else if (msg.startsWith("+addversion") || msg.startsWith("+av")) {
        if (sender == "UnimatrixZeroOne#7501" || sender == "stupiddroid#6140") {
            var argv = msg.split(" ");
            var argc = argv.length;
            var name = "";

            // build the name string
            for (var i = 1; i < (argv.length - 4); i++) {
                name = name + argv[i] + " ";
            }

            name = name.slice(0, -1); // remove trailing space
            var abbv = argv[argc-4];
            var hasOT = argv[argc-3];
            var hasNT = argv[argc-2];
            var hasAPO = argv[argc-1];

            var object = new Version(name, abbv, hasOT, hasNT, hasAPO);
            versionDB.insert(object.toObject(), function(err, doc) {
                if (err) {
                    console.log("[err] versiondb error - ");
                    console.error(err);
                } else {
                    raw.reply("**Version added successfully.**");
                }
            });
        }
    } else if (msg.includes(":") && msg.includes(" ")) {
        var spaceSplit = [];
        var bookIndexes = [];
        var bookNames = [];
        var verses = {};
        var verseCount = 0;

        if (msg.includes("-")) {
            msg.split("-").forEach(function(item) {
                var tempSplit = item.split(":");

                tempSplit.forEach(function(item) {
                    var tempTempSplit = item.split(" ");

                    tempTempSplit.forEach(function(item) {
                        item = item.replaceAll(/[^a-zA-Z0-9:]/g, "");

                        spaceSplit.push(item);
                    });
                });
            });
        } else {
            msg.split(":").forEach(function(item) {
                var tempSplit = item.split(" ");

                tempSplit.forEach(function(item) {
                    spaceSplit.push(item);
                });
            });
        }

        // because of multiple verses with the same book, this
        // must be done to ensure that its not duping itself.
        for (var i = 0; i < spaceSplit.length; i++) {
            try {
                spaceSplit[i] = capitalizeFirstLetter(spaceSplit[i]);
            } catch (e) { /* it'll probably be a number anyways, if this fails */ }

            switch (spaceSplit[i]) {
                case "Sam":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Sm":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Shmuel":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Kgs":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Melachim":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Chron":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Chr":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Cor":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Thess":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Thes":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Tim":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Tm":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Pet":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Pt":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Macc":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Mac":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Esd":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Jn":
                    var num = Number(spaceSplit[i-1]);
                    var bnum = typeof Number(spaceSplit[i-1]) == "number";

                    if (spaceSplit[i-1] && bnum && typeof num == "number" && num > 0 && num < 4) {
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i-1] + temp;
                    }
                    break;
                case "Samuel":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Kings":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Chronicles":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Esdras":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Maccabees":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Corinthians":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Thessalonians":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Timothy":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "Peter":
                    var temp = spaceSplit[i];
                    spaceSplit[i] = spaceSplit[i-1] + temp;
                    break;
                case "John":
                    var num = Number(spaceSplit[i-1]);
                    var bnum = typeof Number(spaceSplit[i-1]) == "number";

                    if (spaceSplit[i-1] && bnum && typeof num == "number" && num > 0 && num < 4) {
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i-1] + temp;
                    }
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

        bookIndexes.forEach(function(index) {
            var verse = [];

            // make sure that its proper verse structure
            // Book chapterNum:chapterVerse
            if (typeof Number(spaceSplit[index + 1]) != "number" ||
                typeof Number(spaceSplit[index + 2]) != "number") {
                return;
            }

            verse.push(spaceSplit[index]); // book name
            verse.push(spaceSplit[index + 1]); // book chapter
            verse.push(spaceSplit[index + 2]); // starting verse

            if (!isNaN(parseFloat(spaceSplit[index + 3]))) {
                verse.push(spaceSplit[index + 3]); // ending verse
            }

            verses[alphabet[verseCount]] = verse;
            verseCount++;
        });

        if (verseCount > 4) {
            var responses = ["spamming me, really?", "no spam pls", "no spam, am good bot", "be nice to me", "don't spam me, i'm a good bot"];
            var randomIndex = Math.floor(Math.random() * (4 - 0)) + 0;

            channel.sendMessage(responses[randomIndex]);

            logMessage("warn", sender, source, "spam attempt - verse count: " + verseCount);
            return;
        }

        async.each(verses, function(verse) {
            for (var i = 0; i < verse.length; i++) {
                if (typeof verse[i] != "undefined") {
                    verse[i] = verse[i].replaceAll(/[^a-zA-Z0-9:]/g, "");
                }
            }
            if (verse.length < 4) {
                var properString = verse[0] + " " + verse[1] + ":" + verse[2];
            } else {
                var properString = verse[0] + " " + verse[1] + ":" + verse[2] + "-" + verse[3];
            }


            getVersion(sender, function (data) {
                var version = "ESV";
                if (data) { version = data[0].version; }

                versionDB.find({"abbv": version}, function (err, docs) {
                    if(docs) {
                        bookNames.forEach(function (book) {
                            var isOT = false;
                            var isNT = false;
                            var isAPO = false;

                            for (index in books.ot) {
                                if (books.ot[index] == book) {
                                    isOT = true;
                                }
                            }

                            if (!docs[0].hasOT && isOT) {
                                logMessage("info", sender, source, "this sender is trying to use the OT with a version that doesn't have it.");
                                channel.sendMessage("The version " + docs[0].name + " doesn't support the Old Testament.");
                                channel.sendMessage("If you want to use the Old Testament, `+setversion` to a version that has it.");
                                return;
                            }

                            for (index in books.nt) {
                                if (books.nt[index] == book) {
                                    isNT = true;
                                }
                            }

                            if (!docs[0].hasNT && isNT) {
                                logMessage("info", sender, source, "this sender is trying to use the NT with a version that doesn't have it.");
                                channel.sendMessage("The version " + docs[0].name + " doesn't support the New Testament.");
                                channel.sendMessage("If you want to use the New Testament, `+setversion` to a version that has it.");
                                return;
                            }

                            for (index in books.apo) {
                                if (books.apo[index] == book) {
                                    isAPO = true;
                                }
                            }

                            if (!docs[0].hasAPO && isAPO) {
                                logMessage("info", sender, source, "this sender is trying to use the APO with a version that doesn't have it.");
                                channel.sendMessage("The version " + docs[0].name + " doesn't support the Apocrypha/Deuterocanon.");
                                channel.sendMessage("If you want to use the Apocrypha/Deuterocanon, `+setversion` to a version that has it.");
                                return;
                            }
                        });

                        bibleGateway.getResult(properString, version).then(function (result) {
                            result.forEach(function (object) {
                                var purifiedObjectText = object.text.replaceAll("“", " \"")
                                                                    .replaceAll("[", " [")
                                                                    .replaceAll("]", "] ")
                                                                    .replaceAll("”", "\" ")
                                                                    .replaceAll("‘", "'")
                                                                    .replaceAll("’", "'")
                                                                    .replaceAll(",", ", ")
                                                                    .replaceAll(".", ". ")
                                                                    .replaceAll(". \"", ".\"")
                                                                    .replaceAll(". '", ".'")
                                                                    .replaceAll(", \"", ",\"")
                                                                    .replaceAll(", '", ",'")
                                                                    .replaceAll(". )", ".)")
                                                                    .replaceAll(", )", ",)")
                                                                    .replaceAll("!", "! ")
                                                                    .replaceAll("! \"", "!\"")
                                                                    .replaceAll("! '", "!'")
                                                                    .replaceAll("?", "? ")
                                                                    .replaceAll("? \"", "?\"")
                                                                    .replaceAll("? '", "?'")
                                                                    .replaceAll(/\s+/g, ' ');

                                var content = "```" + object.title + "\n\n" + purifiedObjectText + "```";
                                var responseString = "**" + object.passage + " - " + object.version + "**\n\n" + content;

                                if (responseString.length < 2000) {
                                    logMessage("info", sender, source, properString);
                                    channel.sendMessage(responseString);
                                } else {
                                    logMessage("info", sender, source, "length of " + properString + " is too long for me");
                                    channel.sendMessage("The passage is too long for me to grab, sorry.");
                                }
                            });
                        }).catch(function (err) {
                            logMessage("err", "global", "bibleGateway", err);
                        });
                    }
                });
            });
        });
    }
});


    bot.login("");

