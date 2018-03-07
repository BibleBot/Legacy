import Language from "../types/language";

const belarusian = require(__dirname + "/../../i18n/belarusian/belarusian.json");
const catalan = require(__dirname + "/../../i18n/catalan/catalan.json");
const chinese_simp = require(__dirname + "/../../i18n/chinese_simp/chinese_simp.json");
const chinese_trad = require(__dirname + "/../../i18n/chinese_trad/chinese_trad.json");
const english_uk = require(__dirname + "/../../i18n/english_uk/english_uk.json");
const english_us = require(__dirname + "/../../i18n/english_us/english_us.json");
const esperanto = require(__dirname + "/../../i18n/esperanto/esperanto.json");
const finnish = require(__dirname + "/../../i18n/finnish/finnish.json");
const french = require(__dirname + "/../../i18n/french/french.json");
const french_qc = require(__dirname + "/../../i18n/french_qc/french_qc.json");
const german = require(__dirname + "/../../i18n/german/german.json");
const hungarian = require(__dirname + "/../../i18n/hungarian/hungarian.json");
const lojban = require(__dirname + "/../../i18n/lojban/lojban.json");
const norwegian = require(__dirname + "/../../i18n/norwegian/norwegian.json");
const polish = require(__dirname + "/../../i18n/polish/polish.json");
const portuguese = require(__dirname + "/../../i18n/portuguese/portuguese.json");
const portuguese_br = require(__dirname + "/../../i18n/portuguese_br/portuguese_br.json");
const spanish = require(__dirname + "/../../i18n/spanish/spanish.json");
const swedish = require(__dirname + "/../../i18n/swedish/swedish.json");
const tagalog = require(__dirname + "/../../i18n/tagalog/tagalog.json");
const turkish = require(__dirname + "/../../i18n/turkish/turkish.json");

export default {

    /*
      languageNameInEnglish: new Language(languageNameInLanguage, rawObject, defaultVersion);
    */

    "belarusian": new Language("Беларускай", belarusian, "NRSV"),
    "catalan": new Language("Català", catalan, "NRSV"),
    "chinese_simp": new Language("简体中文", chinese_simp, "CNVS"),
    "chinese_trad": new Language("繁體中文", chinese_trad, "CNVT"),
    "english_uk": new Language("English (UK)", english_uk, "NRSVA"),
    "english_us": new Language("English (US)", english_us, "NRSV"),
    "esperanto": new Language("Esperanto", esperanto, "NRSV"),
    "finnish": new Language("Suomi", finnish, "R1933"),
    "french": new Language("Français", french, "BDS"),
    "french_qc": new Language("Français (QC)", french_qc, "BDS"),
    "german": new Language("Deutsch", german, "LUTH1545"),
    "hungarian": new Language("Magyar", hungarian, "KAR"),
    "lojban": new Language("Lojban", lojban, "NRSV"),
    "norwegian": new Language("Norsk", norwegian, "DNB1930"),
    "polish": new Language("Polski", polish, "NP"),
    "portuguese": new Language("Português", portuguese, "NVI-PT"),
    "portuguese_br": new Language("Português (BR)", portuguese_br, "NVI-PT"),
    "tagalog": new Language("Tagalog", tagalog, "FSV"),
    "turkish": new Language("Türkçe", turkish, "NRSV"),
    "spanish": new Language("Español", spanish, "NVI"),
    "swedish": new Language("Svenska", swedish, "SV1917"),

    isLanguage: (language) => {
        if (this[language]) {
            return true;
        }

        return false;
    }
};
