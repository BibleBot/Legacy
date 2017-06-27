var request = require("request");
var cheerio = require("cheerio");

// code partially ripped from @toffebjorkskog's node-biblegateway-api
// because i'm impatient (sorry love you)

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};


function purifyText(text) {
    return text.replaceAll("“", " \"")
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
}

var bibleGateway = {
    getRandomVerse: function(version, headings, verseNumbers) {
        var url = "https://dailyverses.net/random-bible-verse";

        var promise = new Promise((resolve, reject) => {
            request(url, function(err, resp, body) {
                if (err !== null) {
                    reject(err);
                }

                var $ = cheerio.load(body);
                var verse = $(".bibleChapter a").first().text();

                this.getResult(verse, version, headings, verseNumbers).then(function(result) {
                    result.forEach(function(object) {
                        var purifiedObjectText = purifyText(object.text);

                        var content = "```" + object.title + "\n\n" + purifiedObjectText + "```";
                        var responseString = "**" + object.passage + " - " + object.version + "**\n\n" + content;

                        if (responseString.length < 2000) {
                            resolve(responseString);
                        } else {
                            getRandomVerse(version);
                        }
                    });
                }).catch(function(err) {
                    logMessage("err", "global", "bibleGateway", err);
                });
            });
        });

        return promise;
    },
    getVOTD: function(version, headings, verseNumbers) {
        var url = "https://www.biblegateway.com/reading-plans/verse-of-the-day/next";

        var promise = new Promise((resolve, reject) => {
            request(url, function(err, resp, body) {
                if (err !== null) {
                    reject(err);
                }

                var $ = cheerio.load(body);
                verse = $(".rp-passage-display").text();

                this.getResult(verse, version, headings, verseNumbers).then(function(result) {
                    result.forEach(function(object) {
                        var purifiedObjectText = purifyText(object.text);

                        var content = "```" + object.title + "\n\n" + purifiedObjectText + "```";
                        var responseString = "**" + object.passage + " - " + object.version + "**\n\n" + content;

                        if (responseString.length < 2000) {
                            resolve(responseString);
                        } else {
                            getVOTD(version);
                        }
                    });
                }).catch(function(err) {
                    logMessage("err", "global", "bibleGateway", err);
                });
            });
        });

        return promise;
    },
    getResult: function(query, version, headings, verseNumbers) {
        var url = "https://www.biblegateway.com/passage/?search=" + query + "&version=" + version + "&interface=print";

        var promise = new Promise((resolve, reject) => {
            request(url, function(err, resp, body) {
                if (err !== null) {
                    reject(err);
                }

                var verses = [];

                var $ = cheerio.load(body);
                $(".result-text-style-normal").each(function() {
                    var verse = $(this);

                    if (headings == "disable") {
                        $(".result-text-style-normal h3").each(function() {
                            $(this).html("");
                        });

                        $(".inline-h3").each(function() {
                            $(this).html("");
                        });
                    }

                    if (verseNumbers == "disable") {
                        $(".chapternum").each(function() {
                            $(this).html("");
                        });

                        $(".versenum").each(function() {
                            $(this).html("");
                        });
                    } else {
                        $(".chapternum").each(function() {
                            $(this).html("[" + $(this).text().slice(0, -1) + "] ");

                        });

                        $(".versenum").each(function() {
                            $(this).html("[" + $(this).text().slice(0, -1) + "] ");

                        });
                    }

                    $(".crossreference").each(function() {
                        $(this).html("");
                    });

                    $(".footnote").each(function() {
                        $(this).html("");
                    });

                    var title = "";
                    verse.find("h3").each(function() {
                        title += $(this).text() + " / ";
                    });

                    $(".crossrefs").html("");
                    $(".footnotes").html("");

                    var verseObject = {
                        "passage": verse.find(".passage-display-bcv").text(),
                        "version": verse.find(".passage-display-version").text(),
                        "title": title.slice(0, -3),
                        "text": purifyText(verse.find("p").text())
                    };

                    verses.push(verseObject);
                });

                resolve(verses);
            });
        });

        return promise;
    }
};

module.exports = bibleGateway;
