import settings from "./settings";
import information from "./information";

export function runCommand(command, args, lang, user, callback) {
    switch (command) {
        case "setversion":
            settings.versions.setVersion(user, args[0], (data) => {
                if (data) {
                    callback({ level: "info", message: "**" + lang.setversionsuccess + "**" });
                } else {
                    callback({ level: "err", message: "**" + lang.setversionfail + "**" });
                }
            });
            break;
        case "version":
            settings.versions.getVersion(user, (data) => {
                if (data) {
                    if (data[0].version) {
                        if (data[0].version == "HWP") data[0].version = "NRSV";
                        let response = lang.versionused;

                        response = response.replace(
                            "<version>", data[0].version);
                        response = response.replace(
                            "<setversion>", lang.commands.setversion);

                        return callback({ level: "info", message: "**" + response + ".**" });
                    } else {
                        let response = lang.noversionused;

                        response = response.replace(
                            "<setversion>", lang.commands.setversion);

                        return callback({ level: "err", message: "**" + response + "**" });
                    }
                } else {
                    let response = lang.noversionused;

                    response = response.replace(
                        "<setversion>", lang.commands.setversion);

                    return callback({ level: "err", message: "**" + response + "**" });
                }
            });
            break;
        case "versions":
            settings.versions.getVersions((availableVersions) => {
                let chatString = "";

                for (let i in availableVersions) {
                    chatString += availableVersions[i] + ", ";
                }

                return callback({ level: "info", message: "**" + lang.versions + ":**\n```" +
                chatString.slice(0,-2) + "```"});
            });
            break;
    }
}

export function runOwnerCommand(command, args, callback) {
    switch (command) {
        case "puppet":
            let message = "";
            for (const argument in args) {
                message += args[argument] + " ";
            }

            callback({ level: "info", message: message });
        case "eval":
            let msg = "";
            for (const argument in args) {
                msg += args[argument] + " ";
            }

            try {
                callback({ level: "info", message: eval(msg) });
            } catch (e) {
                callback({ level: "err", message: "error - " + e.message });
            }
        case "announce":
            let m = "";
            for (const argument in args) {
                m += args[argument] + " ";
            }

            callback({ level: "info", announcement: true, message: m });
    }
}
