// let arabic = require(__dirname + "/../i18n/arabic/arabic.json")
let belarusian = require(__dirname + "/../i18n/belarusian/belarusian.json");
let catalan = require(__dirname + "/../i18n/catalan/catalan.json");
let chinese_simp = require(__dirname + "/../i18n/chinese_simp/chinese_simp.json");
let chinese_trad = require(__dirname + "/../i18n/chinese_trad/chinese_trad.json");
let english_uk = require(__dirname + "/../i18n/english_uk/english_uk.json");
let english_us = require(__dirname + "/../i18n/english_us/english_us.json");
let esperanto = require(__dirname + "/../i18n/esperanto/esperanto.json");
let finnish = require(__dirname + "/../i18n/finnish/finnish.json");
let french = require(__dirname + "/../i18n/french/french.json");
let french_qc = require(__dirname + "/../i18n/french_qc/french_qc.json");
let german = require(__dirname + "/../i18n/german/german.json");
let hungarian = require(__dirname + "/../i18n/hungarian/hungarian.json");
let lojban = require(__dirname + "/../i18n/lojban/lojban.json");
let norwegian = require(__dirname + "/../i18n/norwegian/norwegian.json");
let polish = require(__dirname + "/../i18n/polish/polish.json");
let portuguese = require(__dirname + "/../i18n/portuguese/portuguese.json");
let portuguese_br = require(__dirname +
    "/../i18n/portuguese_br/portuguese_br.json");
let scots = require(__dirname + "/../i18n/scots/scots.json");
let spanish = require(__dirname + "/../i18n/spanish/spanish.json");
let swedish = require(__dirname + "/../i18n/swedish/swedish.json");
let tagalog = require(__dirname + "/../i18n/tagalog/tagalog.json");
let turkish = require(__dirname + "/../i18n/turkish/turkish.json");

let languages = {

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
    "belarusian": {
        "name": "Беларускай",
        "rawobj": belarusian,
        "defversion": "NRSV",
        "complete": true
    },
    // no catalan versions on BibleGateway, yet
    "catalan": {
        "name": "Català",
        "rawobj": catalan,
        "defversion": "NRSV",
        "complete": true
    },
    "chinese_simp": {
        "name": "简体中文",
        "rawobj": chinese_simp,
        "defversion": "CNVS",
        "complete": true
    },
    "chinese_trad": {
        "name": "繁體中文",
        "rawobj": chinese_trad,
        "defversion": "CNVT",
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
    "french_qc": {
        "name": "Français (QC)",
        "rawobj": french_qc,
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
    "polish": {
        "name": "Polski",
        "rawobj": polish,
        "defversion": "NP",
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
    "tagalog": {
        "name": "Tagalog",
        "rawobj": tagalog,
        "defversion": "FSV",
        "complete": true
    },
    "turkish": {
        "name": "Türkçe",
        "rawobj": turkish,
        "defversion": "NRSV",
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