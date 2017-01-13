# BibleBot
A Discord bot for Bible verses.

To use it, just say a Bible verse.

Invite the bot to your server: https://discordapp.com/api/oauth2/authorize?client_id=269407897178472448&scope=bot&permissions=0

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
* `+eval <code>` - execute javascript code
* `+setGlobal <var> <value>` - set a temporary global value while the bot is running
* `+getGlobal <var>` - get a temporary global value

Originally created by Elliott Pardee (@vypr).
