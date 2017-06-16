// Discord API
var Discord = require("discord.js");
var bot = new Discord.Client();
var config;

// For owner-specific configuration
fs.stat("config.js", function(err, stat) {
    if (err === null) {
        logMessage("info", "global", "global", "reading configuration file");
        config = require("config.js");
    } else {
        logMessage("err", "global", "global", "configuration file cannot be accessed, does config.js exist?");
        process.exit(1);
    }
});

// For user version preferences
var dataStore = require("nedb");
var db = new dataStore({
    filename: 'db',
    autoload: true,
    corruptAlertThreshold: 1
});

// Version database
var versionDB = new dataStore({
    filename: 'versiondb',
    autoload: true
});

// for async calls
var async = require("async");

// Other stuff
var books = require("./books");
var Version = require("./version");
var bibleGateway = require("./bibleGateway");

// for logging
var log4js = require('log4js');
log4js.configure({
    appenders: [{
            type: "console"
        },
        {
            type: "dateFile",
            filename: "logs/loggerrino.log",
            pattern: "-yyyy-MM-dd",
            alwaysIncludePattern: false
        }
    ]
});

var logger = log4js.getLogger();

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

function isUnmigrated(user) {
    db.find({
        "user": user
    }, function(err, docs) {
        if (docs.length === 0) {
            return false;
        } else {
            return true;
        }
    });
}

function migrateUserToID(userObject) {
    var username = userObject.username + "#" + userObject.discriminator;
    db.update({
        "user": username
    }, {
        $set: {
            "id": userObject.id
        },
        $unset: {
            "user": username
        }
    });
}

function setVersion(user, version, callback) {
    version = version.toUpperCase();

    versionDB.find({
        "abbv": version
    }, function(err, docs) {
        if (docs.length === 0) {
            return callback(null);
        }
        db.find({
            "id": user.id
        }, function(err, doc) {
            if (doc.length > 0) {
                db.update({
                    "id": user.id
                }, {
                    $set: {
                        "version": version
                    }
                }, {
                    "multi": true
                }, function(err, docs) {
                    return callback(docs);
                });
            } else {
                db.insert({
                    "id": user.id,
                    "version": version
                }, function(err, docs) {
                    return callback(docs);
                });
            }
        });
    });
}

function setHeadings(user, headings, callback) {
    headings = headings.toLowerCase();

    if (headings != "enable" && headings != "disable") {
        return callback(null);
    }
    db.find({
        "id": user.id
    }, function(err, doc) {
        if (doc.length > 0) {
            db.update({
                "id": user.id
            }, {
                $set: {
                    "headings": headings
                }
            }, {
                "multi": true
            }, function(err, docs) {
                return callback(docs);
            });
        } else {
            db.insert({
                "id": user.id,
                "headings": headings
            }, function(err, docs) {
                return callback(docs);
            });
        }
    });
}

function setVerseNumbers(user, verseNumbers, callback) {
    verseNumbers = verseNumbers.toLowerCase();

    if (verseNumbers != "enable" && verseNumbers != "disable") {
        return callback(null);
    }
    db.find({
        "id": user.id
    }, function(err, doc) {
        if (doc.length > 0) {
            db.update({
                "id": user.id
            }, {
                $set: {
                    "verseNumbers": verseNumbers
                }
            }, {
                "multi": true
            }, function(err, docs) {
                return callback(docs);
            });
        } else {
            db.insert({
                "id": user.id,
                "verseNumbers": verseNumbers
            }, function(err, docs) {
                return callback(docs);
            });
        }
    });
}

function getVersion(user, callback) {
    db.find({
        "id": user.id
    }, function(err, docs) {
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

    var rawSender = raw.author;
    var sender = rawSender.username + "#" + rawSender.discriminator;
    var channel = raw.channel;
    var guild = raw.guild;
    var msg = raw.content;
    var source;

    if (isUnmigrated(sender)) {
        migrateUserToID(rawSender);
    }

    if ((typeof channel.guild != "undefined") && (typeof channel.name != "undefined")) {
        source = channel.guild.name + "#" + channel.name;
    } else {
        source = "unknown";
    }

    if (sender == options.botname) return;
    if (source.includes("Discord Bots") && sender != "UnimatrixZeroOne#7501") return;

    // for verse arrays
    var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
        "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x",
        "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
        "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
        "W", "X", "Y", "Z"
    ];

    if (msg.startsWith("+leave") && sender == options.owner) {
        logMessage("info", sender, source, "+leave");
        try {
            if (guild != "undefined") {
                //channel.sendMessage("Attempting to leave server: " + guild.id);
                guild.leave();
            }
        } catch (e) {
            channel.sendMessage(e);
        }
    } else if (msg.startsWith("+puppet") && sender == options.owner) {
        raw.delete();
        logMessage("info", sender, source, "+puppet");
        channel.sendMessage(msg.replaceAll("+puppet ", ""));
    } else if (msg == "+biblebot") {
        logMessage("info", sender, source, "+biblebot");
        channel.sendMessage("**BibleBot (formerly known as HolyBot) by vipr and UnimatrixZeroOne** - code: <https://github.com/UnimatrixZeroOne/BibleBot>\n\n```commands:\n* `+setversion ABBV` - set preferred version to ABBV\n* `+version` - see what version you've set\n* `+versions` - see the supported versions\n* `+random` - get a random Bible verse\n* `+verseoftheday` (`+votd`) - get the verse of the day\n* `+headings enable/disable` - enable or disable topic headings\n* `+versenumbers enable/disable` - enable or disable verse numbers from showing on each line```\n**To use it, just say a Bible verse. I'll handle the rest.**");
    } else if (msg == "+random") {
        getVersion(rawSender, function(data) {
            var version = "ESV";
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

            bibleGateway.getRandomVerse(version, headings, verseNumbers).then(function(result) {
                logMessage("info", sender, source, "+random");
                channel.sendMessage(result);
            });
        });
    } else if (msg == "+verseoftheday" || msg == "+votd") {
        getVersion(rawSender, function(data) {
            var version = "ESV";
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
            bibleGateway.getVOTD(version, headings, verseNumbers).then(function(result) {
                logMessage("info", sender, source, "+votd");
                channel.sendMessage(result);
            });
        });
    } else if (msg.startsWith("+setversion")) {
        if (msg.split(" ").length != 2) {
            versionDB.find({}, function(err, docs) {
                var chatString = "";
                for (var i in docs) {
                    chatString += docs[i].abbv + ", ";
                }

                logMessage("info", sender, source, "empty +setversion sent");
                raw.reply("**I support:**\n\n```" + chatString.slice(0, -2) + "```");
            });
            return;
        } else {
            setVersion(rawSender, msg.split(" ")[1], function(data) {
                if (data) {
                    logMessage("info", sender, source, "+setversion " + msg.split(" ")[1]);
                    raw.reply("**Set version successfully.**");
                } else {
                    versionDB.find({}, function(err, docs) {
                        var chatString = "";
                        for (var i in docs) {
                            chatString += docs[i].abbv + ", ";
                        }

                        logMessage("info", sender, source, "failed +setversion");
                        raw.reply("**Failed to set version, I only support:**\n\n```" + chatString.slice(0, -2) + "```");
                    });
                }
            });
        }

        return;
    } else if (msg.startsWith("+headings")) {
        if (msg.split(" ").length != 2) {
            logMessage("info", sender, source, "empty +headings sent");
            raw.reply("**Use +headings enable OR +headings disable**");
        } else {
            setHeadings(sender, msg.split(" ")[1], function(data) {
                if (data) {
                    logMessage("info", sender, source, "+headings " + msg.split(" ")[1]);
                    raw.reply("**Set headings successfully.**");
                } else {
                    logMessage("info", sender, source, "failed +headings");
                    raw.reply("**Use +headings enable OR +headings disable**");
                }
            });
        }

        return;
    } else if (msg.startsWith("+versenumbers")) {
        if (msg.split(" ").length != 2) {
            logMessage("info", sender, source, "empty +versenumbers sent");
            raw.reply("**Use +versenumbers enable OR +versenumbers disable**");
        } else {
            setVerseNumbers(sender, msg.split(" ")[1], function(data) {
                if (data) {
                    logMessage("info", sender, source, "+versenumbers " + msg.split(" ")[1]);
                    raw.reply("**Set versenumbers successfully.**");
                } else {
                    logMessage("info", sender, source, "failed +versenumbers");
                    raw.reply("**Use +versenumbers enable OR +versenumbers disable**");
                }
            });
        }

        return;
    } else if (msg == "+version") {
        getVersion(rawSender, function(data) {
            logMessage("info", sender, source, "+version");
            if (data) {
                raw.reply("**You are using " + data[0].version + ". Use `+setversion` to set a different version.**");
            } else {
                raw.reply("**I couldn't find your name in my database, have you used `+setversion` yet?**");
            }
        });

        return;
    } else if (msg == "+versions") {
        versionDB.find({}, function(err, docs) {
            var chatString = "";
            for (var i in docs) {
                chatString += docs[i].abbv + ", ";
            }

            logMessage("info", sender, source, "+versions");
            raw.reply("**I support:**\n\n```" + chatString.slice(0, -2) + "```");
        });
    } else if (msg.startsWith("+addversion") || msg.startsWith("+av")) {
        if (sender == options.owner || (options.versionadders.indexOf(sender) != -1)) {
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
                    var bnum = typeof Number(spaceSplit[i - 1]) == "number";

                    if (spaceSplit[i - 1] && bnum && typeof num == "number" && num > 0 && num < 4) {
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
                    var bnum = typeof Number(spaceSplit[i - 1]) == "number";

                    if (spaceSplit[i - 1] && bnum && typeof num == "number" && num > 0 && num < 4) {
                        var temp = spaceSplit[i];
                        spaceSplit[i] = spaceSplit[i - 1] + temp;
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


            getVersion(rawSender, function(data) {
                var version = "ESV";
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

                versionDB.find({
                    "abbv": version
                }, function(err, docs) {
                    if (docs) {
                        bookNames.forEach(function(book) {
                            var isOT = false;
                            var isNT = false;
                            var isAPO = false;

                            for (var index in books.ot) {
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

                            for (var index in books.nt) {
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

                            for (var index in books.apo) {
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

                        bibleGateway.getResult(properString, version, headings, verseNumbers).then(function(result) {
                            result.forEach(function(object) {
                                var content = "```" + object.title + "\n\n" + object.text + "```";
                                var responseString = "**" + object.passage + " - " + object.version + "**\n\n" + content;

                                if (responseString.length < 2000) {
                                    logMessage("info", sender, source, properString);
                                    channel.sendMessage(responseString);
                                } else {
                                    logMessage("info", sender, source, "length of " + properString + " is too long for me");
                                    channel.sendMessage("The passage is too long for me to grab, sorry.");
                                }
                            });
                        }).catch(function(err) {
                            logMessage("err", "global", "bibleGateway", err);
                        });
                    }
                });
            });
        });
    }
});


bot.login(options.token);


bot.login(options.token);
