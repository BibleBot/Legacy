var catalan = require(__dirname + "/../i18n/catalan/catalan.json");
var deflang = require(__dirname + "/../i18n/default/default.json");
var english_uk = require(__dirname + "/../i18n/english_uk/english_uk.json");
var english_us = require(__dirname + "/../i18n/english_us/english_us.json");
var esperanto = require(__dirname + "/../i18n/esperanto/esperanto.json");
var french = require(__dirname + "/../i18n/french/french.json");
var norwegian = require(__dirname + "/../i18n/norwegian/norwegian.json");
var portuguese = require(__dirname + "/../i18n/portuguese/portuguese.json");
var portuguese_br = require(__dirname + "/../i18n/portuguese_br/portuguese_br.json");
var scots = require(__dirname + "/../i18n/scots/scots.json");
var spanish = require(__dirname + "/../i18n/spanish/spanish.json");

var languages = {
    // "language technical name": { "name": (name in the language), "rawobj": (the language object), "defversion": (default version for language), "complete": (whether it's a complete translation [t/f])}
    "catalan": {"name": "Català", "rawobj": catalan, "defversion": "ESV", "complete": true }, // no catalan versions on BibleGateway, yet
    "deflang": {"name": "Default", "rawobj": deflang, "defversion": "ESV", "complete": true },
    "english_uk": {"name": "English (UK)", "rawobj": english_uk, "defversion": "ESVUK", "complete": true },
    "english_us": {"name": "English (US)", "rawobj": english_us, "defversion": "ESV", "complete": true },
    "esperanto": {"name": "Esperanto", "rawobj": esperanto, "defversion": "ESV", "complete": true }, // despite being public domain, still no Esperanto bible on BibleGateway
    "french": {"name": "Français", "rawobj": french, "defversion": "BDS", "complete": true },
    "norwegian": {"name": "Norsk", "rawobj": norwegian, "defversion": "DNB1930", "complete": true },
    "portuguese": {"name": "Português", "rawobj": portuguese, "defversion": "NVI-PT", "complete": true },
    "portuguese_br": {"name": "Português (BR)", "rawobj": portuguese_br, "defversion": "NVI-PT", "complete": true },
    "scots": {"name": "Scots", "rawobj": scots, "defversion": "ESV", "complete": false },
    "spanish": {"name": "Español", "rawobj": spanish, "defversion": "NVI", "complete": true },
}

languages.isLanguage = function (language) {
    if (languages[language]) {
        return true;
    }

    return false;
}

languages.isIncomplete = function (language) {
    if (languages.isLanguage(language)) {
        if (language[language].complete) {
            return false;
        }

        return true;
    }
}

module.exports = languages;
