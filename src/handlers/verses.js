import Handler from "../types/handler";
import books from "../data/books";

import settings from "./commands/settings";
import central from "../central";

import * as utils from "./verses/utils";

import * as bibleGateway from "../bible-modules/bibleGateway";
import * as rev from "../bible-modules/rev";
import * as kjv1611 from "../bible-modules/kjv1611";

export default class VerseHandler extends Handler {
    constructor() {
        super("VERSE_EVENT");
    }

    processRawMessage(shard, rawMessage, sender, lang, callback) {
        settings.versions.getVersionsByAcronym((availableVersions) => {
            const msg = rawMessage.content;

            if (msg.includes(":") && msg.includes(" ")) {
                let split = utils.tokenize(msg);
                let bookIndexes = [];
                let bookNames = [];
                let verses = {};
                let verseCount = 0;

                // because of multiple verses with the same book, this
                // must be done to ensure that its not duping itself.
                for (let i = 0; i < split.length; i++) {
                    try {
                        split[i] = utils.purify(split[i]);
                    } catch (e) {
                        /* it'll probably be a number anyways, if this fails */
                    }

                    // this parses any numbered books
                    split[i] = utils.parseNumberedBook(split[i], split, i);

                    // matches book names to the index
                    // of where they are in split
                    const book = utils.purgeBrackets(split[i]);
                    const difference = utils.getDifference(book, split[i]);

                    if (books.ot[book.toLowerCase()]) {
                        bookNames.push(books.ot[book.toLowerCase()]);
                        split[i] = difference + books.ot[book.toLowerCase()];
                        bookIndexes.push(i);
                    }

                    if (books.nt[book.toLowerCase()]) {
                        bookNames.push(books.nt[book.toLowerCase()]);
                        split[i] = difference + books.nt[book.toLowerCase()];
                        bookIndexes.push(i);
                    }

                    if (books.apo[book.toLowerCase()]) {
                        bookNames.push(books.apo[book.toLowerCase()]);
                        split[i] = difference + books.apo[book.toLowerCase()];
                        bookIndexes.push(i);
                    }
                }

                bookIndexes.forEach((index) => {
                    let verse = [];
                    let invalid = false;

                    verse = utils.createVerseObject(split, index, availableVersions);

                    if (typeof verse === "string") {
                        if (verse.startsWith("invalid")) {
                            invalid = true;
                            return callback({
                                invalid: invalid
                            });
                        }
                    }

                    // the alphabet organization may be
                    // unnecessary, but i put it in as a
                    // safeguard
                    if (!invalid) {
                        verses[verseCount] = verse;
                        verseCount++;
                    }
                });

                // we don't want to flood a server
                if (verseCount > 6) {
                    const responses = ["spamming me, really?", "no spam pls",
                        "no spam, am good bot", "be nice to me",
                        "don't spam me, i'm a good bot", "hey buddy, get your own " +
                        "bot to spam"
                    ];

                    const randomIndex = Math.floor(Math.random() * (4 - 0)) + 0;

                    return callback(responses[randomIndex]);
                }

                // lets formulate a verse reference
                // (yes, we tokenize the message, only to make
                // another verse reference; this is so we ensure it's
                // an actual verse, not something else)
                // the result of this ends up being "Genesis 1:1"
                // in line with our current example
                for (let i = 0; i < Object.keys(verses).length; i++) {
                    const verse = verses[i];
                    let reference = utils.createReferenceString(verse);

                    // and now we begin the descent of
                    // returning the result to the sender
                    // by getting the proper version to process
                    settings.versions.getVersion(sender, (data) => {
                        let version = lang.getDefaultVersion();
                        let headings = "enable";
                        let verseNumbers = "enable";

                        if (data) {
                            if (data[0].hasOwnProperty('version')) {
                                // RIP HWP (a while ago - January 1st, 2018)
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

                        if (reference.split(" | v: ")[1] !== undefined) {
                            version = reference.split(" | v: ")[1];
                            reference = reference.split(" | v: ")[0];
                        }

                        central.versionDB.find({
                            "abbv": version
                        }, (err, docs) => {
                            if (docs) {
                                let continueProcessing = true;

                                bookNames.forEach((book) => {
                                    // now once we have our version
                                    // make sure that the version we're using
                                    // has the books we want (organized by testament/canon)
                                    // TODO: change APO to DEU
                                    let isOT = false;
                                    let isNT = false;
                                    let isAPO = false;

                                    for (let index in books.ot) {
                                        if (books.ot[index] === book) {
                                            isOT = true;
                                        }
                                    }

                                    if (!docs[0].hasOT && isOT) {
                                        let response =
                                            lang.otnotsupported;
                                        response = response.replace(
                                            "<version>", docs[0].name);

                                        let response2 =
                                            lang.otnotsupported2;
                                        response2 = response2.replace(
                                            "<setversion>",
                                            lang.commands.setversion);

                                        continueProcessing = false;

                                        return callback({
                                            level: "err",
                                            twoMessages: true,
                                            reference: reference,
                                            firstMessage: response,
                                            secondMessage: response2
                                        });
                                    }

                                    for (let index in books.nt) {
                                        if (books.nt[index] === book) {
                                            isNT = true;
                                        }
                                    }

                                    if (!docs[0].hasNT && isNT) {
                                        let response =
                                            lang.ntnotsupported;
                                        response = response.replace(
                                            "<version>", docs[0].name);

                                        let response2 =
                                            lang.ntnotsupported2;
                                        response2 = response2.replace(
                                            "<setversion>",
                                            lang.commands.setversion);

                                        continueProcessing = false;

                                        return callback({
                                            level: "err",
                                            twoMessages: true,
                                            reference: reference,
                                            firstMessage: response,
                                            secondMessage: response2
                                        });
                                    }

                                    for (let index in books.apo) {
                                        if (books.apo[index] === book) {
                                            isAPO = true;
                                        }
                                    }

                                    if (!docs[0].hasAPO && isAPO) {
                                        let response =
                                            lang.aponotsupported;
                                        response = response.replace(
                                            "<version>", docs[0].name);

                                        let response2 =
                                            lang.aponotsupported2;
                                        response2 = response2.replace(
                                            "<setversion>",
                                            lang.commands.setversion);

                                        continueProcessing = false;

                                        return callback({
                                            level: "err",
                                            twoMessages: true,
                                            reference: reference,
                                            firstMessage: response,
                                            secondMessage: response2
                                        });
                                    }
                                });

                                // now we ask our bibleGateway bridge
                                // to nicely provide us with a verse object
                                // to send back; the last step of the process
                                if (continueProcessing) {
                                    if (version !== "KJV1611" && version !== "REV") {
                                        bibleGateway.getResult(
                                                reference, version, headings, verseNumbers)
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
                                                            reference: reference,
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
                                                            reference: reference,
                                                            firstMessage: responseString1,
                                                            secondMessage: content2
                                                        });
                                                    } else {
                                                        return callback({
                                                            level: "err",
                                                            twoMessages: false,
                                                            reference: reference,
                                                            message: lang.passagetoolong
                                                        });
                                                    }
                                                });
                                            }).catch((err) => {
                                                central.logMessage(
                                                    "err", shard, "global", "bibleGateway", err);
                                            });
                                    } else if (version === "REV") {
                                        rev.getResult(reference, version, headings, verseNumbers)
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
                                                            reference: reference,
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
                                                            reference: reference,
                                                            firstMessage: responseString1,
                                                            secondMessage: content2
                                                        });
                                                    } else {
                                                        return callback({
                                                            level: "err",
                                                            twoMessages: false,
                                                            reference: reference,
                                                            message: lang.passagetoolong
                                                        });
                                                    }
                                                });
                                            }).catch((err) => {
                                                central.logMessage(
                                                    "err", shard, "global", "rev", err);
                                            });
                                    } else {
                                        kjv1611.getResult(reference, version, headings, verseNumbers)
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
                                                            reference: reference,
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
                                                            reference: reference,
                                                            firstMessage: responseString1,
                                                            secondMessage: content2
                                                        });
                                                    } else {
                                                        return callback({
                                                            level: "err",
                                                            twoMessages: false,
                                                            reference: reference,
                                                            message: lang.passagetoolong
                                                        });
                                                    }
                                                });
                                            }).catch((err) => {
                                                central.logMessage(
                                                    "err", shard, "global", "kjv1611", err);
                                            });
                                    }
                                }
                            }
                        });
                    });
                };
            }
        });
    }
}
