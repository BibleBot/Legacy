let request = require("request");
let cheerio = require("cheerio");

// code partially ripped from @toffebjorkskog's node-biblegateway-api
// because i'm impatient (sorry love you)

// remove a buncha noise characters from
// `text`, and converting some characters
// to others accordingly
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

function removeBibleTitleInSearch(string) {
    return string.replaceAll(/<[^>]*> /g, "");
}

export function search(version, query) {
    let url = "https://www.biblegateway.com/quicksearch/?search=" +
        query + "&version=" + version + "&searchtype=all&limit=100000&interface=print";

    const searchResults = {};
    let length = 0;

    const promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            const $ = cheerio.load(body);

            $(".row").each(function() {
                let result = {};

                $(".bible-item-extras").each(function() {
                    $(this).html("");
                });

                result.title = $(this).find(".bible-item-title").text();

                result.text = removeBibleTitleInSearch(purifyText($(this).find(".bible-item-text").text()).slice(0, -1));

                if (result.title === "" || result.title.split(" ").length > 2) {
                    return;
                }

                searchResults["result" + length++] = result;
            });

            resolve(searchResults);
        });
    });

    return promise;
}

// take a guess at what this does
export function getRandomVerse(version, headings, verseNumbers) {
    const url = "https://dailyverses.net/random-bible-verse";

    const promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            const $ = cheerio.load(body);
            const verse = $(".bibleChapter a").first().text();

            // yep, we load up the **whole**
            // dailyverses page, just to send the reference
            // to Bible Gateway
            getResult(verse, version, headings, verseNumbers)
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
                            this.getRandomVerse(version, headings, verseNumbers);
                        }
                    });
                }).catch((err) => {
                    reject(err);
                });
        });
    });

    return promise;
}

export function getVOTD(version, headings, verseNumbers) {
    const url =
        "https://www.biblegateway.com/reading-plans/verse-of-the-day/next";

    const promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            const $ = cheerio.load(body);
            const verse = $(".rp-passage-display").text();

            // same thing as getRandomVerse()
            getResult(verse, version, headings, verseNumbers)
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
}
export function getResult(query, version, headings, verseNumbers) {
    // formulate a URL based on what we have
    const url = "https://www.biblegateway.com/passage/?search=" + query +
        "&version=" + version + "&interface=print";

    const promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            const verses = [];

            const $ = cheerio.load(body);

            // we work through `.result-text-style-normal`
            // as Bible Gateway has all of its text inside it
            // it's the one container that has everything we need
            // inside
            $(".result-text-style-normal").each(function() {
                const verse = $(this);

                if (headings === "disable") {
                    $(".result-text-style-normal h3").each(function() {
                        $(this).html("");
                    });

                    $(".inline-h3").each(function() {
                        $(this).html("");
                    });
                }

                if (verseNumbers === "disable") {
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
                if (headings === "enable") {
                    verse.find("h3").each(function() {
                        title += $(this).text() + " / ";
                    });
                }

                $(".crossrefs").html("");
                $(".footnotes").html("");

                // formulate a nice verseObject to send back
                const verseObject = {
                    "passage": verse.find(".passage-display-bcv").text(),
                    "version": verse.find(".passage-display-version").text(),
                    "title": title.slice(0, -3),
                    "text": purifyText(verse.find("p").text())
                };

                verses.push(verseObject);
            });

            // estimated delivery date: 5ms
            resolve(verses);
        });
    });

    return promise;
}
