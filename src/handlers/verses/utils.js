export function tokenize(msg) {
    let array = [];

    if (msg.includes("-")) {
        msg.split("-").forEach((item) => {
            const split = item.split(":");

            split.forEach((item) => {
                const tempSplit = item.split(" ");

                tempSplit.forEach((item) => {
                    item = item.replaceAll(/[^a-zA-Z0-9:()"'<>|\\/;*&^%$#@!.+_?=]/g, "");

                    array.push(item);
                });
            });
        });
    } else {
        msg.split(":").forEach((item) => {
            const split = item.split(" ");

            split.forEach((item) => {
                array.push(item);
            });
        });
    }

    return array;
}

export function purify(msg) {
    return msg = msg.replaceAll("(", "")
        .replaceAll(")", "")
        .replaceAll("[", "")
        .replaceAll("]", "")
        .replaceAll("?", "")
        .replaceAll("_", "")
        .replaceAll("*", "")
        .replaceAll("-", "")
        .replaceAll("\\", "")
        .replaceAll("`", "")
        .capitalizeFirstLetter();
}

export function checkForNumberedBooks(item, array, index) {
    switch (item) {
        case "Sam":
        case "Sm":
        case "Shmuel":
        case "Kgs":
        case "Melachim":
        case "Chron":
        case "Chr":
        case "Cor":
        case "Thess":
        case "Thes":
        case "Tim":
        case "Tm":
        case "Pet":
        case "Pt":
        case "Macc":
        case "Mac":
        case "Esd":
        case "Samuel":
        case "Kings":
        case "Chronicles":
        case "Esdras":
        case "Maccabees":
        case "Corinthians":
        case "Thessalonians":
        case "Timothy":
        case "Peter":
        case "151":
            array[index] = array[index - 1] + item;
            break;
        case "Esther":
            if ((array[index - 1] === "Greek")) {
                array[index] = array[index - 1] + item;
            } else {
                array[index] = "Esther";
            }
            break;
        case "Jeremiah":
            const isLetter = ((array[index - 2] + array[index - 1]) === "LetterOf");

            if (isLetter) {
                array[index] = "LetterOfJeremiah";
            } else {
                array[index] = "Jeremiah";
            }
            break;
        case "Dragon":
            array[index] = array[index - 3] + array[index - 2] +
                array[index - 1] + item;
            break;
        case "Men":
        case "Youths":
        case "Children":
            array[index] = array[index - 5] + array[index - 4] +
                array[index - 3] + array[index - 2] +
                array[index - 1] + item;
            break;
        case "Azariah":
        case "Manasses":
        case "Manasseh":
        case "Solomon":
        case "Songs":
            array[index] = array[index - 2] + array[index - 1] +
                item;
            break;
        case "John":
        case "Jn":
            const num = Number(array[index - 1]);
            const bnum = !isNaN(Number(
                array[index - 1]));

            if (array[index - 1] && bnum && !isNaN(num) &&
                num > 0 && num < 4) {
                array[index] = array[index - 1] + item;
            }
            break;
    }

    return array[index];
}

export function createVerseObject(array, bookIndex, availableVersions) {
    let verse = [];

    // make sure that its proper verse structure
    // Book chapterNum:chapterVerse
    if (isNaN(Number(array[bookIndex + 1])) ||
        isNaN(Number(array[bookIndex + 2]))) {
        return "invalid";
    }

    // if it's surrounded by angle brackets
    // we want to ignore it
    if (array[bookIndex].indexOf("<") !== -1) {
        return "invalid";
    }

    const angleBracketIndexes = [];
    for (let i in array) {
        if ((i < bookIndex) && (array[i].indexOf("<") !== -1)) {
            angleBracketIndexes.push(i);
        }

        if ((i > bookIndex) && (array[i].indexOf(">") !== -1)) {
            angleBracketIndexes.push(i);
        }
    }

    if (angleBracketIndexes.length === 2) {
        if (angleBracketIndexes[0] < bookIndex &&
            angleBracketIndexes[1] > bookIndex) {
            return "invalid";
        }
    }

    // organize our variables correctly
    let book = array[bookIndex];
    let chapter = array[bookIndex + 1];
    let startingVerse = array[bookIndex + 2];

    // ignore any other angle brackets
    // as we've already properly detected
    // whether they surround the verse
    try {
        book = array[bookIndex].replace("<", "");
        book = book.replace(">", "");

        chapter = array[bookIndex + 1].replace("<", "");
        chapter = chapter.replace(">", "");

        startingVerse = array[bookIndex + 2].replace("<", "");
        startingVerse = startingVerse.replace(">", "");
    } catch (e) { /* this won't be a problem */ }

    // this becomes our verse array
    // ex. [ "Genesis", "1", "1" ]
    verse.push(book);
    verse.push(chapter);
    verse.push(startingVerse);

    // check if there's an ending verse
    // if so, add it to the verse array
    if (array[bookIndex + 3] !== undefined) {
        if (array[bookIndex + 3].indexOf(">") !== -1) {
            return;
        }
        if (!isNaN(Number(array[bookIndex + 3]))) {
            if (Number(array[bookIndex + 3]) >
                Number(array[bookIndex + 2])) {
                let endingVerse = array[bookIndex + 3].replace("<", "");
                endingVerse = endingVerse.replace(">", "");
                verse.push(endingVerse);
            }
        } else {
            if (availableVersions.indexOf(array[bookIndex + 3]) !== -1) {
                array[bookIndex + 3] = array[bookIndex + 3].toUpperCase();
                let version = array[bookIndex + 3].replace("<", "");
                version = version.replace(">", "");
                verse.push("v - " + version);
            }
        }
    }

    if (array[bookIndex + 4] !== undefined) {
        if (isNaN(Number(array[bookIndex + 4]))) {
            array[bookIndex + 4] = array[bookIndex + 4].toUpperCase();
            if (availableVersions.indexOf(array[bookIndex + 4]) !== -1) {
                let version = array[bookIndex + 4].replace("<", "");
                version = version.replace(">", "");
                verse.push("v - " + version);
            }

        } else if (array[bookIndex + 4].indexOf(">") !== -1) {
            return;
        }
    }

    return verse;
}

export function createReferenceString(verse) {
    let reference;

    for (let k = 0; k < verse.length; k++) {
        if (typeof verse[k] !== "undefined") {
            verse[k] = verse[k].replaceAll(/[^a-zA-Z0-9:]/g, "");
        }
    }

    if (isNaN(Number(verse[1])) ||
        isNaN(Number(verse[2]))) {
        return;
    }

    if (verse.length > 4) {
        if (isNaN(Number(verse[3]))) {
            return;
        }
    }

    if (verse.length <= 3) {
        reference = verse[0] + " " + verse[1] +
            ":" + verse[2];
    } else {
        if (verse[3] !== undefined) {
            if (verse[3].startsWith("v")) {
                reference = verse[0] + " " + verse[1] + ":" +
                    verse[2] + " | v: " + verse[3].substr(1);
            }
        }

        if (verse[4] !== undefined) {
            if (verse[4].startsWith("v")) {
                reference = verse[0] + " " + verse[1] + ":" +
                    verse[2] + "-" + verse[3] + " | v: " + verse[4].substr(1);
            } else {
                if (verse[3].startsWith("v")) {
                    reference = verse[0] + " " + verse[1] + ":" +
                        verse[2] + " | v: " + verse[3].substr(1);
                } else {
                    reference = verse[0] + " " + verse[1] + ":" +
                        verse[2] + "-" + verse[3];
                }
            }
        }

        if (reference === undefined) {
            reference = verse[0] + " " + verse[1] + ":" +
                verse[2] + "-" + verse[3];
        }
    }

    return reference;
}
