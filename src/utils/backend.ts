import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import gql from "graphql-tag";
import { fetch } from 'cross-fetch/polyfill';
import { request } from "graphql-request";
import { Message, TextChannel, VoiceChannel, CategoryChannel } from 'discord.js';

export class BackendService {
  static apolloClient: ApolloClient<any>;

  async loginUser() {
    const query = `
        query {
          loginUser(email: "${process.env.API_ADMIN_USER}", password: "${process.env.API_ADMIN_PASSWORD}") {
            id
            jwt
            email
          }
        }
        `;

    let data: any = await request(process.env.API_URL, query);
    return data && data.loginUser;
  }

  async getSettingsWithBanlist(podId: string) {
    const query = `
      query getSettings($id: String) {
        getSettings(id: $id) {
          id
          banlistId
        }
      }`;

    let data: any = await request(process.env.API_URL, query, { id: podId });//await BackendService.apolloClient.query({ query, variables: {id: podId} });

    return data && data.getSettings;
  }

  async getFullBanlist(id: number, settingsId: string) {
    const query = `
    query getFullBanlist($id: Int!, $settingsId: String) {
      getFullBanlist(id: $id, settingsId: $settingsId) {
        settingsId
        dexId
        species
        allowed
      }
    }`;

    let data: any = await request(process.env.API_URL, query, { id, settingsId });

    return data && data.getFullBanlist;
  }

  async createTournament(channel: CategoryChannel | TextChannel | VoiceChannel, message: Message) {
    const mutation = `
    mutation createTournament($data: TournamentInput) {
      createTournament(data: $data) {
        id
        name
        mechanic
      }
    }
    `;

    const [, name, mechanic] = message.content.split(' ');

    const newTournament = {
      data: {
        id: channel.id,
        name,
        mechanic
      }
    };
    
    let data: any = await request(process.env.API_URL, mutation, newTournament);

    return data && data.createTournament;
  }

  async modifyTournament(data: any) {
    const mutation = `
    mutation modifyTournament($id: String, $data: TournamentInput) {
      modifyTournament(id: $id, data: $data) {
        id
        name
        mechanic
      }
    }
    `;
  }

  async getTournament(message: Message) {
    const query = `
    query getTournament($id: String) {
      getTournament(id: $id) {
        id
        name
        mechanic
        pods {
          id
          name
          mechanic
          mechanicFormat
        }
        members {
          id
          email
        }
        settings {
          id
          banlistId
          scoringType          
        }
        createdAt
      }
    }`;

    let [, id] = message.content.split(" ");

    if (!id) {
      id = (<CategoryChannel | TextChannel | VoiceChannel>message.channel).parentID;
    }

    let data: any = await request(process.env.API_URL, query, { id });

    return data && data.getTournament;
  }

  async addTournamentSettings(input: any) {
    const mutation = `
    mutation createSettings($data: TournamentSettingsInput) {
      createSettings(data: $data) {
        id
        multiPod
        banlistId
        tournament {
          name
        }
      }
    }`;

    const requestInput = {
      id: input.id,
      multiPod: input.multiPod,
      tournamentId: input.id,
      banlistId: input.banlistId
    };
    
    let data: any = await request(process.env.API_URL, mutation, { data: requestInput });

    return data && data.createSettings;
  }

  async createPod(input: any) {
    const mutation = `
    mutation createPod($data: PodInput) {
      createPod(data: $data) {
        id
        name
        tournament {
          id
          name
        }
        tournamentId
        mechanic
        mechanicFormat
      }
    }`;

    const requestInput = {
      id: input.id,
      name: input.name,
      mechanic: input.mechanic,
      mechanicFormat: input.mechanicFormat,
      iconImageUrl: input.iconImageUrl,
      userId: input.userId,
      tournamentId: input.tournamentId
    };

    let data: any = await request(process.env.API_URL, mutation, { data: requestInput });

    return data && data.createPod;
  }

  async getPod(message: Message) {
    const query = `
    query getPod($id: String) {
      getPod(id: $id) {
        id
        tournamentId
        name
        mechanic
        mechanicFormat
        iconImageUrl
        createdAt
        members {
          id
          email
        }
      }
    }`;

    let [, id] = message.content.split(' ');
    
    if (!id) {
      id = message.channel.id; 
    } else {
      let channel = await message.guild.channels.find(c => c.name === id.charAt(0).toLowerCase().concat(id.substr(1)) || c.id === id);

      if (channel) {
        id = channel.id;
      }
    }
    
    let data: any = await request(process.env.API_URL, query, { id });
    
    return data && data.getPod;
  }

  async updatePod(id: string, input: any) {
    const mutation = `
    mutation modifyPod($id: String, $data: PodInput) {
      modifyPod(id: $id, data: $data) {
        id
        name
        tournament {
          id
          name
        }
        tournamentId
        mechanic
        mechanicFormat
      }
    }`;

    if (!id) {
      throw 'Missing Pod ID';
      return [];
    }
console.log(id, input)
    let data: any = await request(process.env.API_URL, mutation, { id, data: input });
console.log(data)
    return data && data.modifyPod;
  }
}