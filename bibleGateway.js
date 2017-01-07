var request = require("request");
var cheerio = require("cheerio");

// code partially ripped from @toffebjorkskog's node-biblegateway-api
// because i'm impatient (sorry love you)

var bibleGateway = {
    getResult: function (query, version, headings, verseNumbers) {
        var url = "https://www.biblegateway.com/passage/?search=" + query + "&version=" + version + "&interface=print";

        var promise = new Promise( (resolve, reject) => {
            request(url, function (err, resp, body) {
                if (err != null) {
                    reject(err);
                }

                var verses = [];

                var $ = cheerio.load(body);
                $(".result-text-style-normal").each(function () {
                    var verse = $(this);

                    if (headings == "disable"){
                      $(".result-text-style-normal h3").each(function () {
                        $(this).html("");
                      })
                    }

                    if (verseNumbers == "disable"){
                        $(".chapternum").each(function () {
                            $(this).html("");
                        });

                        $(".versenum").each(function () {
                            $(this).html("");
                        });
                    } else {
                        $(".chapternum").each(function () {
                            $(this).html("[" + $(this).text().slice(0, -1) + "] ");

                        });

                        $(".versenum").each(function () {
                            $(this).html("[" + $(this).text().slice(0, -1) + "] ");

                        });
                    }

                    $(".crossreference").each(function () {
                        $(this).html("");
                    });

                    $(".footnote").each(function () {
                        $(this).html("");
                    });

                    var title = "";
                    verse.find("h3").each(function () {
                        title += $(this).text() + " / ";
                    });


                    $(".crossrefs").html("")
                    $(".footnotes").html("");

                    var verseObject = {
                        "passage": verse.find(".passage-display-bcv").text(),
                        "version": verse.find(".passage-display-version").text(),
                        "title": title.slice(0, -3),
                        "text": verse.find("p").text()
                    }

                    verses.push(verseObject);
                });

                resolve(verses);
            });
        });

        return promise;
    }
}

module.exports = bibleGateway;
