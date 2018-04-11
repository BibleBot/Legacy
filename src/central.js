const languages = require("./data/languages");
const consola = require("consola");

const config = require("./data/config");

consola.level = 5;

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

// For user version preferences
const Datastore = require("nedb");

let db = new Datastore({
    filename: './databases/db',
    autoload: true,
    corruptAlertThreshold: 1
});

let versionDB = new Datastore({
    filename: './databases/versiondb',
    autoload: true
});

module.exports = {
    languages,
    db,
    versionDB,
    dividers: { first: config.dividingBrackets[0], second: config.dividingBrackets[1] },
    splitter: (s) => {
        let middle = Math.floor(s.length / 2);
        let before = s.lastIndexOf(' ', middle);
        let after = s.indexOf(' ', middle + 1);

        if (before === -1 || (after !== -1 && middle - before >= after - middle)) {
            middle = after;
        } else {
            middle = before;
        }

        let first = s.substr(0, middle);
        let second = s.substr(middle + 1);

        return {
            "first": first,
            "second": second
        };
    },
    logMessage: (level, shard, sender, channel, message) => {
        let content = "[shard " + shard + "] <" + sender + "@" + channel + "> " + message;

        switch (level) {
            case "start":
                consola.start(content);
                break;
            case "debug":
                consola.debug(content);
                break;
            case "info":
                consola.info(content);
                break;
            case "err":
                consola.error(content);
                break;
            case "warn":
                consola.warn(content);
                break;
        }
    },
    sleep: (milliseconds) => {
        const start = new Date().getTime();
        for (let i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }
};
