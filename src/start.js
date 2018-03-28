import config from "./data/config";

import * as Discord from "discord.js";
const shardingManager = new Discord.ShardingManager("./build/bot.js", {
    totalShards: config.shards
});

shardingManager.spawn();
