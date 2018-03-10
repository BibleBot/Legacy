import central from "../../central";

export default {
    versions: {
        setVersion: (user, version, callback) => {
            version = version.toUpperCase();

            central.versionDB.find({
                abbv: version
            }, function(err, docs) {
                if (docs.length === 0) {
                    return callback(null);
                }
                central.db.find({
                    id: user.id
                }, function(err, doc) {
                    if (doc.length > 0) {
                        central.db.update({
                            id: user.id
                        }, {
                            $set: {
                                version: version
                            }
                        }, {
                            multi: true
                        }, function(err, docs) {
                            return callback(docs);
                        });
                    } else {
                        central.db.insert({
                            id: user.id,
                            version: version
                        }, function(err, docs) {
                            return callback(docs);
                        });
                    }
                });
            });
        },

        getVersion: (user, callback) => {
            central.db.find({
                id: user.id
            }, function(err, docs) {
                if (docs.length > 0) {
                    return callback(docs);
                } else {
                    return callback(null);
                }
            });
        },

        getVersions: (callback) => {
            central.versionDB.find({}, function(err, docs) {
                const versions = [];

                for (let doc in docs) {
                    versions.push(docs[doc].abbv);
                }

                return callback(versions.sort());
            });
        }
    },
    languages: {
        setLanguage: (user, language, callback) => {
            if (central.languages[language]) {
                central.db.find({
                    id: user.id
                }, function(err, doc) {
                    if (doc.length > 0) {
                        central.db.update({
                            id: user.id
                        }, {
                            $set: {
                                language: language
                            }
                        }, {
                            multi: true
                        }, function(err, docs) {
                            return callback(docs);
                        });
                    } else {
                        central.db.insert({
                            id: user.id,
                            language: language
                        }, function(err, docs) {
                            return callback(docs);
                        });
                    }
                });
            } else {
                return callback(null);
            }
        },

        getLanguage: (user, callback) => {
            central.db.find({
                id: user.id
            }, function(err, docs) {
                if (docs.length > 0) {
                    if (central.languages[docs[0].language]) {
                        return callback(central.languages[docs[0].language]);
                    } else {
                        return callback(central.languages.english_us);
                    }
                } else {
                    return callback(central.languages.english_us);
                }
            });
        },

        getLanguages: (callback) => {
            const array = [];

            for (const lang in central.languages) {
                array.push({
                    name: central.languages[lang].getName(),
                    objectName: lang
                });
            }

            return callback(array);
        }
    },
    formatting: {
        setHeadings: (user, headings, callback) => {
            headings = headings.toLowerCase();

            if (headings !== "enable" && headings !== "disable") {
                return callback(null);
            }

            central.db.find({
                id: user.id
            }, function(err, doc) {
                if (doc.length > 0) {
                    central.db.update({
                        id: user.id
                    }, {
                        $set: {
                            headings: headings
                        }
                    }, {
                        multi: true
                    }, function(err, docs) {
                        return callback(docs);
                    });
                } else {
                    central.db.insert({
                        id: user.id,
                        headings: headings
                    }, function(err, docs) {
                        return callback(docs);
                    });
                }
            });
        },

        getHeadings: (user, callback) => {
            central.db.find({
                id: user.id
            }, function(err, docs) {
                if (docs.length > 0) {
                    if (docs.headings) {
                        return callback(docs.headings);
                    } else {
                        return callback(null);
                    }
                } else {
                    return callback(null);
                }
            });
        },

        setVerseNumbers: (user, verseNumbers, callback) => {
            verseNumbers = verseNumbers.toLowerCase();

            if (verseNumbers !== "enable" && verseNumbers !== "disable") {
                return callback(null);
            }

            central.db.find({
                id: user.id
            }, function(err, doc) {
                if (doc.length > 0) {
                    central.db.update({
                        id: user.id
                    }, {
                        $set: {
                            verseNumbers: verseNumbers
                        }
                    }, {
                        multi: true
                    }, function(err, docs) {
                        return callback(docs);
                    });
                } else {
                    central.db.insert({
                        id: user.id,
                        verseNumbers: verseNumbers
                    }, function(err, docs) {
                        return callback(docs);
                    });
                }
            });
        },

        getVerseNumbers: (user, callback) => {
            central.db.find({
                id: user.id
            }, function(err, docs) {
                if (docs.length > 0) {
                    if (docs.verseNumbers) {
                        return callback(docs.verseNumbers);
                    } else {
                        return callback(null);
                    }
                } else {
                    return callback(null);
                }
            });
        }
    }
};
