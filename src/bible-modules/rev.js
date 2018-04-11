const request = require("request");
const cheerio = require("cheerio");

// code partially ripped from @toffebjorkskog's node-biblegateway-api
// because i'm impatient (sorry love you)

function purifyText(text) {
    return text.replaceAll("“", " \"")
        .replaceAll("[", " <")
        .replaceAll("]", "> ")
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

const rev = {
    getRandomVerse: (version, headings, verseNumbers) => {
        const url = "https://dailyverses.net/random-bible-verse";

        const promise = new Promise((resolve, reject) => {
            request(url, (err, resp, body) => {
                if (err !== null) {
                    reject(err);
                }

                const $ = cheerio.load(body);
                const verse = $(".bibleChapter a").first().text();

                rev.getResult(verse, version, headings, verseNumbers)
                    .then((result) => {
                        result.forEach((object) => {
                            const content =
                                "```Dust\n" + object.title + "\n\n" +
                                object.text + "```";

                            const responseString = "**" + object.passage + " - " +
                                object.version + "**\n\n" +
                                content;

                            if (responseString.length < 2000) {
                                resolve(responseString);
                            } else {
                                rev.getRandomVerse(version, headings, verseNumbers);
                            }
                        });
                    }).catch((err) => {
                        reject(err);
                    });
            });
        });

        return promise;
    },

    getVOTD: (version, headings, verseNumbers) => {
        const url =
            "https://www.biblegateway.com/reading-plans/verse-of-the-day/next";

        const promise = new Promise((resolve, reject) => {
            request(url, (err, resp, body) => {
                if (err !== null) {
                    reject(err);
                }

                const $ = cheerio.load(body);
                const verse = $(".rp-passage-display").text();

                rev.getResult(verse, version, headings, verseNumbers)
                    .then((result) => {
                        result.forEach((object) => {
                            const content =
                                "```Dust\n" + object.title + "\n\n" +
                                object.text + "```";

                            const responseString = "**" + object.passage + " - " +
                                object.version + "**\n\n" +
                                content;

                            if (responseString.length < 2000) {
                                resolve(responseString);
                            } else {
                                resolve("too long");
                            }
                        });
                    }).catch((err) => {
                        reject(err);
                    });
            });
        });

        return promise;
    },

    getResult: (query, version, headings, verseNumbers) => {
        const split = query.split(":");
        const book = split[0].split(" ")[0];
        const chapter = split[0].split(" ")[1];
        const startingVerse = split[1].split("-")[0];
        const endingVerse = (split[1].split("-").length > 1) ? split[1].split("-")[1] : 0;

        const url = "https://www.revisedenglishversion.com/" + book +
            "/" + chapter + "/";

        const promise = new Promise((resolve, reject) => {
            request(url, (err, resp, body) => {
                if (err !== null) {
                    reject(err);
                }

                const verses = [];

                const $ = cheerio.load(body);

                $(".col1container").each(function() {
                    let title = "";
                    let text = "";

                    $(".versenum").each(function() {
                        $(this).html(
                            "[" + $(this).text() + "] ");
                    });

                    $(".versenumcomm").each(function() {
                        $(this).html(
                            "[" + $(this).text() + "] ");
                    });

                    $(".fnmark").each(function() {
                        $(this).html("");
                    });

                    if (startingVerse > endingVerse) {
                        $(this).html($(this).html().split("[" + (Number(startingVerse) + 1) + "]")[0].split("[" + startingVerse + "]")[1]);


                        $(this).find(".headingfirst").each(function() {
                            title += $(this).text() + " / ";
                        });

                        $(this).find(".heading").each(function() {
                            title += $(this).text() + " / ";
                        });

                        text = " [" + startingVerse + "]" + $(this).text();
                        text = text.replace(/(\r\n|\n|\r)/gm, " ").slice(1, -1);
                    } else {
                        $(this).html($(this).html().split("[" + (Number(endingVerse) + 1) + "]")[0].split("[" + startingVerse + "]")[1]);

                        $(this).find(".headingfirst").each(function() {
                            title += $(this).text() + " / ";
                            $(this).text("");
                        });

                        $(this).find(".heading").each(function() {
                            title += $(this).text() + " / ";
                            $(this).text("");
                        });

                        text = " [" + startingVerse + "]" + $(this).text();
                        text = text.replace(/(\r\n|\n|\r)/gm, " ").slice(1, -1);
                    }

                    if (verseNumbers === "disable") {
                        text = text.replace(/.?\[[0-9]\]/g, "");
                    }

                    if (headings === "disable") {
                        title = "";
                    }

                    const verseObject = {
                        "passage": query,
                        "version": "Revised English Version (REV)",
                        "title": (title === "") ? "" : title.slice(0, -3),
                        "text": purifyText(text)
                    };

                    verses.push(verseObject);

                });

                resolve(verses);
            });
        });

        return promise;
    }
};

module.exports = rev;