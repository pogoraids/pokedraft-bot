import * as Discord from "discord.js";
import * as sql from "sqlite";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { GREETING } from "./src/constants/messages";
import { Listener } from "./src/modules/listener";
import { Channels } from "./src/modules/channels";
import { Configuration } from "./src/modules/configuration";
import { ENV } from "./src/config";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import gql from "graphql-tag";
import {fetch} from 'cross-fetch/polyfill';
import { BackendService} from './src/utils/backend';
/*
const apolloClient = new ApolloClient({
  typeDefs: gql`
  type TournamentSettings {
    id: Int!
    limit: Int
    onlySolo: Boolean
    scoringType: String
    timeOrder: Boolean
    multiPod: Boolean
    customScoringModel: String
    masterSheet: String
    banlistId: Int
    banlist: [Banlist]
}

type Banlist {
    id: Int!
    dexId: Int!
    species: String
    allowed: Boolean
}
  `,
  link: createHttpLink({
    uri: 'http://localhost:3005/graphql',
    fetch: fetch
  }),
  cache: new InMemoryCache()
});*/

export class Index {
  constructor() {
    // BackendService.apolloClient = apolloClient;
    const api = new BackendService();

    api.loginUser().then(data => {
      console.log(data);
    });

    const client = new Discord.Client();
    const TOKEN = ENV.DISCORD_TOKEN;

    client.on("ready", () => {
      console.log(GREETING);

      if (!!ENV.MANAGED_GUILD_ID) {
        const guild = client.guilds.find(guild => guild.id === ENV.MANAGED_GUILD_ID);

        if (!!guild) {
          sql
            .open(resolve(dirname(".") + `${ENV.SQLITE_FILEDIR}/${guild.id}.sqlite`))
            .then((database: sql.Database) => {
              new Channels().createBotChannel(guild, client);
            })
            .catch(reason => {
              console.error(
                "Failed to retrieve database file / generic error\n",
                reason
              );
            });
        }
      } else {
        client.guilds.forEach(guild => {
          // ToDo(): refactor in a helper + BotDBWrapper
          sql
            .open(resolve(dirname(".") + `/database/${guild.id}.sqlite`))
            .then((database: sql.Database) => {
              new Channels().createBotChannel(guild, client);
            })
            .catch(reason => {
              console.error(
                "Failed to retrieve database file / generic error\n",
                reason
              );
            });
        });
      }
    });

    client.on("message", new Listener().parse);
    client.login(TOKEN.toString());
  }
}

new Index();
