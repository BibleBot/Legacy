// var arabic = require(__dirname + "/../i18n/arabic/arabic.json")
var catalan = require(__dirname + "/../i18n/catalan/catalan.json");
var english_uk = require(__dirname + "/../i18n/english_uk/english_uk.json");
var english_us = require(__dirname + "/../i18n/english_us/english_us.json");
var esperanto = require(__dirname + "/../i18n/esperanto/esperanto.json");
var finnish = require(__dirname + "/../i18n/finnish/finnish.json");
var french = require(__dirname + "/../i18n/french/french.json");
var german = require(__dirname + "/../i18n/german/german.json");
var lojban = require(__dirname + "/../i18n/lojban/lojban.json");
var norwegian = require(__dirname + "/../i18n/norwegian/norwegian.json");
var portuguese = require(__dirname + "/../i18n/portuguese/portuguese.json");
var portuguese_br = require(__dirname +
    "/../i18n/portuguese_br/portuguese_br.json");
var scots = require(__dirname + "/../i18n/scots/scots.json");
var spanish = require(__dirname + "/../i18n/spanish/spanish.json");
var swedish = require(__dirname + "/../i18n/swedish/swedish.json");

var languages = {

    /*
      "language technical name":
        { "name": (name in the language),
          "rawobj": (the language object),
          "defversion": (default version for language),
          "complete": (whether it's a complete translation [t/f])
        }
    */

    /*"arabic": {
        "name": "Arabic",
        "rawobj": arabic,
        "defversion": "NAV",
        "complete": true
    },*/
    // no catalan versions on BibleGateway, yet
    "catalan": {
        "name": "Català",
        "rawobj": catalan,
        "defversion": "NRSV",
        "complete": true
    },
    "english_uk": {
        "name": "English (UK)",
        "rawobj": english_uk,
        "defversion": "NRSVA",
        "complete": true
    },
    "english_us": {
        "name": "English (US)",
        "rawobj": english_us,
        "defversion": "NRSV",
        "complete": true
    },
    // despite being public domain,
    // still no Esperanto bible on BibleGateway
    "esperanto": {
        "name": "Esperanto",
        "rawobj": esperanto,
        "defversion": "NRSV",
        "complete": true
    },
    "finnish": {
        "name": "Suomi",
        "rawobj": finnish,
        "defversion": "R1933",
        "complete": true
    },
    "french": {
        "name": "Français",
        "rawobj": french,
        "defversion": "BDS",
        "complete": true
    },
    "german": {
        "name": "Deutsch",
        "rawobj": german,
        "defversion": "LUTH1545",
        "complete": true
    },
    "lojban": {
        "name": "Lojban",
        "rawobj": lojban,
        "defversion": "NRSV",
        "complete": true,
    },
    "norwegian": {
        "name": "Norsk",
        "rawobj": norwegian,
        "defversion": "DNB1930",
        "complete": true
    },
    "portuguese": {
        "name": "Português",
        "rawobj": portuguese,
        "defversion": "NVI-PT",
        "complete": true
    },
    "portuguese_br": {
        "name": "Português (BR)",
        "rawobj": portuguese_br,
        "defversion": "NVI-PT",
        "complete": true
    },
    "scots": {
        "name": "Scots",
        "rawobj": scots,
        "defversion": "NRSV",
        "complete": false
    },
    "spanish": {
        "name": "Español",
        "rawobj": spanish,
        "defversion": "NVI",
        "complete": true
    },
    "swedish": {
        "name": "Svenska",
        "rawobj": swedish,
        "defversion": "SV1917",
        "complete": true
    },
    isLanguage: (language) => {
        if (languages[language]) {
            return true;
        }

        return false;
    },
    isIncomplete: (language) => {
        if (languages.isLanguage(language)) {
            if (languages[language].complete) {
                return false;
            }

            return true;
        }
    }
};

module.exports = languages;