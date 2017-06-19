# BibleBot
A Discord bot for Bible verses.

To use it, just say a Bible verse.

---

Installation:
```sh
git clone https://github.com/UnimatrixZeroOne/BibleBot.git;
npm install;
mv src/config.example.js src/config.js;
$EDITOR src/config.js;
npm run build;
npm run start;
```

---

Commands:

* `+versions` - show all Bible translations you can set
* `+setversion <version>` - set a preferred version
* `+version` - display your current version
* `+random` - get a random Bible verse
* `+verseoftheday` (`+votd`) - get the verse of the day
* `+headings enable/disable` - enable or disable the headings that display on certain verses
* `+versenumbers enable/disable` - enable or disable verse numbers from showing on each line

Bot Owner Commands:

* `+addversion <versionname> <abbv> <hasOT> <hasNT> <hasAPO>` - add a version (`+av`)
* `+puppet <message>` - say something as the bot

Invite BibleBot to your server! https://discordapp.com/api/oauth2/authorize?client_id=269407897178472448&scope=bot&permissions=0

---

Versioning:

Every commit, add 1 to the last number of the version, if the result is 10,
add 1 to the second number of the version. If the result of the second number is 10,
add 1 to the first number of the version.


Examples: 2.8.9 --> Commit --> 2.9.0
          2.9.8 --> Commit --> 2.9.9
          2.9.9 --> Commit --> 3.0.0
---

Originally a fork of "HolyBot" created by Elliott Pardee (@[vypr](https://github.com/vypr)).
