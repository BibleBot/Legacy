const config = require("./data/config.js");

const Discord = require("discord.js");
const shardingManager = new Discord.ShardingManager("./src/bot.js", {
    totalShards: config.shards
});

shardingManager.spawn();