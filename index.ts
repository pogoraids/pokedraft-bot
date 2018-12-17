import * as Discord from "discord.js";
import * as sql from "sqlite";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { GREETING } from "./src/constants/messages";
import { Listener } from "./src/modules/listener";
import { Channels } from "./src/modules/channels";
import { Configuration } from "./src/modules/configuration";

export class Index {
  constructor() {
    const client = new Discord.Client();
    const TOKEN = readFileSync("./src/config/token");
    let db = null;

    client.on("ready", () => {
      console.log(GREETING);

      client.guilds.forEach(guild => {
        // ToDo(): refactor in a helper + BotDBWrapper
        sql
          .open(resolve(dirname(".") + `/database/${guild.id}.sqlite`))
          .then((database: sql.Database) => {
            new Channels().createBotChannel(guild);
          })
          .catch(reason => {
            console.error(
              "Failed to retrieve database file / generic error\n",
              reason
            );
          });
      });
    });

    client.on("message", new Listener().parse);

    client.login(TOKEN.toString());
  }
}

new Index();
