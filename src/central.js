import languages from "./data/languages";
import * as log4js from "log4js";

log4js.configure({
    appenders: {
        'out': {
            type: 'console',
            layout: {
                type: 'coloured'
            }
        }
    },
    categories: {
        default: {
            appenders: ['out'],
            level: 'debug'
        }
    }
});

let logger = log4js.getLogger();

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

// For user version preferences
let Datastore = require("nedb"); // for some reason this is unimportable
let db = new Datastore({
    filename: './databases/db',
    autoload: true,
    corruptAlertThreshold: 1
});

let versionDB = new Datastore({
    filename: './databases/versiondb',
    autoload: true
});

export default {
    languages,
    db,
    versionDB,
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
            case "debug":
                logger.debug(content);
                break;
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
