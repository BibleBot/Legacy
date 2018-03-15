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
        .replaceAll("¶ ", "")
        .replaceAll("¶", "")
        .replaceAll("� ", "")
        .replaceAll("�", "")
        .replaceAll(/\s+/g, ' ');
}

export function getRandomVerse(version, headings, verseNumbers) {
    const url = "https://dailyverses.net/random-bible-verse";

    const promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            const $ = cheerio.load(body);
            const verse = $(".bibleChapter a").first().text();

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
    const split = query.split(":");
    let book = split[0].split(" ")[0];
    const chapter = split[0].split(" ")[1];
    const startingVerse = split[1].split("-")[0];
    const endingVerse = (split[1].split("-").length > 1) ? split[1].split("-")[1] : 0;

    if (!isNaN(Number(book[0]))) {
        book = book[0] + "-" + book.slice(1, 0);
    }

    if (book === "SongofSongs") {
        book = "Song-of-Solomon";
    } else if (book === "GreekEsther") {
        book = "Additions-to-Esther";
    } else if (book === "Wisdom") {
        book = "Wisdom-of-Solomon";
    } else if (book === "LetterofJeremiah") {
        book = "Letter-of-Jeremiah";
    }

    const url = "https://www.kingjamesbibleonline.org/1611_" + book +
        "-Chapter-" + chapter + "/";

    const promise = new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err !== null) {
                reject(err);
            }

            const verses = [];

            const $ = cheerio.load(body);

            $(".chapters_div_in").each(function() {
                let text = "";

                $(".versehover").each(function() {
                    $(this).html(
                        "[" + $(this).text().slice(0, -1) + "] ");
                });

                if (startingVerse > endingVerse) {
                    $(this).html($(this).html().split("[" + (Number(startingVerse) + 1) + "]")[0].split("[" + startingVerse + "]")[1]);

                    text = " [" + startingVerse + "]" + $(this).text();
                    text = text.replace(/(\r\n|\n|\r)/gm, " ").slice(1, -1);
                } else {
                    $(this).html($(this).html().split("[" + (Number(endingVerse) + 1) + "]")[0].split("[" + startingVerse + "]")[1]);

                    text = " [" + startingVerse + "]" + $(this).text();
                    text = text.replace(/(\r\n|\n|\r)/gm, " ").slice(1, -1);
                }

                if (verseNumbers === "disable") {
                    text = text.replace(/.?\[[0-9]\]/g, "");
                }

                const verseObject = {
                    "passage": query,
                    "version": "1611 King James Version with Deuterocanon (KJV1611)",
                    "title": "",
                    "text": purifyText(text)
                };

                verses.push(verseObject);

            });

            resolve(verses);
        });
    });

    return promise;
}
