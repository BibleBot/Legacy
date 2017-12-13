let request = require("request");
let cheerio = require("cheerio");
//import { SynchronousPromise } from "synchronous-promise";
import central from "./central";

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

export function getRandomVerse(version, headings, verseNumbers) {
    let url = "https://dailyverses.net/random-bible-verse";

    let promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            let $ = cheerio.load(body);
            let verse = $(".bibleChapter a").first().text();

            getResult(verse, version, headings, verseNumbers)
                .then((result) => {
                    result.forEach((object) => {
                      	let content =
                            "```Dust\n" + object.title + "\n\n" +
                            object.text + "```";
                      
                        let responseString = "**" + object.passage + " - " +
                            object.version + "**\n\n" +
                            content;

                        if (responseString.length < 2000) {
                            resolve(responseString);
                        } else {
                            this.getRandomVerse(version, headings, verseNumbers);
                        }
                    });
                }).catch((err) => {
                    central.logMessage("err", "global", "bibleGateway", err);
                });
        });
    });

    return promise;
}

export function getVOTD(version, headings, verseNumbers) {
    let url =
        "https://www.biblegateway.com/reading-plans/verse-of-the-day/next";

    let promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            let $ = cheerio.load(body);
            let verse = $(".rp-passage-display").text();

            getResult(verse, version, headings, verseNumbers)
                .then((result) => {
                    result.forEach((object) => {
                      	let content =
                            "```Dust\n" + object.title + "\n\n" +
                            object.text + "```";
                      
                        let responseString = "**" + object.passage + " - " +
                            object.version + "**\n\n" +
                            content;

                        if (responseString.length < 2000) {
                            resolve(responseString);
                        } else {
                            resolve("too long");
                        }
                    });
                }).catch((err) => {
                    central.logMessage("err", "global", "bibleGateway", err);
                });
        });
    });

    return promise;
}
export function getResult(query, version, headings, verseNumbers) {
    let url = "https://www.biblegateway.com/passage/?search=" + query +
        "&version=" + version + "&interface=print";

    let promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            let verses = [];

            let $ = cheerio.load(body);

            // NOTE: DO NOT TRY TO MAKE FUNCTION() INTO () =>
            // IT WILL BREAK EVERYTHING
            $(".result-text-style-normal").each(function() {
                let verse = $(this);

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
                        $(this).html(" ");
                    });

                    $(".versenum").each(function() {
                        $(this).html(" ");
                    });
                } else {
                    $(".chapternum").each(function() {
                        $(this).html(
                            "[" + $(this).text().slice(0, -1) + "] ");

                    });

                    $(".versenum").each(function() {
                        $(this).html(
                            "[" + $(this).text().slice(0, -1) + "] ");

                    });
                }

                $(".crossreference").each(function() {
                    $(this).html("");
                });

                $(".footnote").each(function() {
                    $(this).html("");
                });

                let title = "";
                if (headings == "enable") {
                    verse.find("h3").each(function() {
                        title += $(this).text() + " / ";
                    });
                }

                $(".crossrefs").html("");
                $(".footnotes").html("");

                let verseObject = {
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