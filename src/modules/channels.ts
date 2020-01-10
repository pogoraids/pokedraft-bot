import * as Discord from "discord.js";
import { Message, Role, RichEmbed } from 'discord.js';
import { APP_ID, embedFooter, mechanicFormatsImgUrl } from "../constants/app";
import { Configuration } from "./configuration";
import { BotDBWrapper } from "../utils/sqlite/botDbWrapper";
import { Helpers } from "../utils/helpers";
import * as L10n from "../constants/messages";
import { BackendService } from "../utils/backend";

export class Channels {
  footer: { text: string, icon: string } = embedFooter;

  constructor() { }

  async createDraft(
    message: Discord.Message,
    name2: string,
    members?: Discord.GuildMember[]
  ) {
    const { guild, channel } = message;
    const api = new BackendService();
    const [, name, mechanic, addRole = 'y'] = message.content.split(" ");

    if (!guild) return;

    const configData = await new BotDBWrapper().getGuildData(guild.id);

    if (configData) {
      let authorizedRoles = configData.rolesAllowed.split(",");
      let guildMember = guild.members.find(
        member => message.author.id == member.id
      );

      if (
        !guildMember.roles.find(role => role.hasPermissions("ADMINISTRATOR"))
      ) {
        console.log("User doesn't have the ADMINISTRATOR role");

        let found = false;

        for (const authRole of authorizedRoles) {
          if (guildMember.roles.find(role => role.id === authRole)) {
            found = true;
            break;
          }
        }

        if (!found) {
          channel.send(
            "You cannot use `create-draft` here or you don't have enough permissions."
          );
          return;
        }
      }

      if (guild.channels.find(channel => channel.name === name)) {
        channel.send(name + " category already existent.");
      } else {
        const categoryPermissions = await this.getPermissions(guild, "HIDDEN");
        const newCategory = await guild.createChannel(name, "category", categoryPermissions);

        if (newCategory) {
          channel.send("Category " + name + " created!");
          const tournament = await api.createTournament(newCategory, message);
          const tSettings = await api.addTournamentSettings(tournament);

          if (addRole && ['y', 'Y', 'YES', 'yes'].lastIndexOf(addRole) !== -1) {
            const newRole = await guild.createRole({ name, mentionable: true });
            console.log(newRole);
            channel.send(`New role ${name} created!`);
          }
        }
      }
    } else {
      channel.send(
        `No server config established (namely rolesAllowed). Please do so with set-config`
      );
    }
  }

  createDivision(
    message: Discord.Message,
    name: string,
    members?: Discord.GuildMember[]
  ) {
    const guild = message.guild;

    if (!guild) return;

    new BotDBWrapper().getGuildData(guild.id).then(configData => {
      if (configData) {
        let authorizedRoles = configData.rolesAllowed.split(",");
        let guildMember = guild.members.find(
          member => message.author.id == member.id
        );

        if (
          !guildMember.roles.find(role => role.hasPermissions("ADMINISTRATOR"))
        ) {
          console.log("User doesn't have the ADMINISTRATOR role");

          let found = false;

          for (const authRole of authorizedRoles) {
            if (guildMember.roles.find(role => role.id === authRole)) {
              found = true;
              break;
            }
          }

          if (!found) {
            message.channel.send(
              "You cannot use `create-division` here or you don't have enough permissions."
            );
            return;
          }
        }

        const [category, division] = name.split(" ");
        let catObject = null;

        if (!category) {
          message.channel.send("Category " + category + " not found");
          return;
        } else {
          catObject = guild.channels.find(channel => channel.name === category);
        }

        if (!division) {
          message.channel.send(
            "Both category and division names must be specified"
          );
          return;
        }

        if (guild.channels.find(channel => channel.name === division)) {
          message.channel.send(division + " channel already existent.");
        } else {
          if (!catObject) {
            message.channel.send("Category " + category + " not found");
            return;
          }

          guild
            .createRole({
              name: division,
              permissions: [
                "SEND_MESSAGES",
                "READ_MESSAGES",
                "READ_MESSAGE_HISTORY",
                "EMBED_LINKS",
                "ATTACH_FILES",
                "ADD_REACTIONS"
              ]
            })
            .then((role: Discord.Role) => {
              role.setMentionable(true);

              this.getPermissions(guild, "DIVISION", role.id).then(
                divisionPermissions => {
                  let permissions = [...divisionPermissions];

                  guild
                    .createChannel(division, "text", permissions)
                    .then(divisionChannel => {
                      divisionChannel.setParent(catObject.id);

                      message.channel.send(
                        "Division " + division + " and role created!"
                      );

                      new BotDBWrapper()
                        .getAllDivisionsFromGuild(guild.id)
                        .then((data: any[]) => {
                          if (!data) {
                            new BotDBWrapper().setDivisionData(
                              guild.id,
                              "1",
                              ["divisionName"],
                              [division]
                            );
                          } else {
                            new BotDBWrapper().setDivisionData(
                              guild.id,
                              "" + (data.length + 1),
                              ["divisionName"],
                              [division]
                            );
                          }
                        });
                    });
                }
              );
            })
            .catch(err => {
              console.error(err);
              console.log(
                "Check if rolesAllowed configuration was set for the user accessing this command."
              );
            });
        }
      } else {
        console.log("Error getting data");
      }
    });
  }

  createBotChannel(guild: Discord.Guild, client?: Discord.Client) {
    if (!guild) {
      return;
    }

    //for (let guild of client.guilds.array()) {
    if (!guild.channels.find(channel => channel.name === "draftbot-admin")) {
      const role = guild.roles.find(role =>
        role.hasPermission([Discord.Permissions.FLAGS.ADMINISTRATOR])
      );
      //this.getPermissions(guild, 'ADMIN', role.id).then(adminPermissions => {
      const permissionsArray = [];
      const generalPermissions = [
        "SEND_MESSAGES",
        "READ_MESSAGES",
        "READ_MESSAGE_HISTORY"
      ];
      permissionsArray.push({
        id: role.id,
        allowed: generalPermissions
      });
      permissionsArray.push({
        id: guild.defaultRole.id,
        denied: generalPermissions
      });
      permissionsArray.push({
        id: APP_ID,
        allowed: generalPermissions
      });
      const botChannelPermissions = [...permissionsArray];

      guild
        .createChannel("draftbot-admin", "text", botChannelPermissions)
        .then((channel: Discord.GuildChannel) => {
          console.log("Admin channel created for guild: " + guild.name);
          new BotDBWrapper().createGuildCatalog(guild.id);
          new BotDBWrapper().createDivisionCatalog(guild.id);
        });
      //})
    } else {
      console.log("Admin channel already created on " + guild.name);

      /*db.get('select * from GuildCatalog').then(v=>{
					console.log(v);
				})*/

      new BotDBWrapper().getGuildData(guild.id, guild.name).then(guildData => {
        if (guildData) {
          client.user.setPresence({
            status: "online",
            game: { name: guild.name + " PokeDraft!" }
          });
        }
      });
    }
    //}
  }

  getPermissions(
    guild: Discord.Guild,
    mode: "HIDDEN" | "ADMIN" | "DIVISION",
    roleId?: string
  ) {
    let permissions = [
      "SEND_MESSAGES",
      "READ_MESSAGES",
      "READ_MESSAGE_HISTORY"
    ];
    let permissionObj: {
      allowed?: string[];
      denied?: string[];
      id?: string;
    } = {};
    let permissionsArray = [];

    return new BotDBWrapper()
      .getGuildData(guild.id)
      .then(rowData => {
        if (rowData && rowData.rolesAllowed) {
          rowData.rolesAllowed.split(",").forEach(configRole => {
            permissionsArray.push({
              id: configRole,
              allowed: [...permissions, "ADD_REACTIONS"]
            });
          });
        }

        if (mode === "HIDDEN") {
          permissionsArray.push({
            id: guild.defaultRole.id,
            denied: permissions
          });
          permissionsArray.push({
            id: APP_ID,
            allowed: permissions
          });
        } else if (mode === "ADMIN") {
          permissionsArray.push({
            id: roleId,
            allowed: permissions
          });
          permissionsArray.push({
            id: guild.defaultRole.id,
            denied: permissions
          });
          permissionsArray.push({
            id: APP_ID,
            allowed: permissions
          });
        } else if (mode === "DIVISION") {
          permissionsArray.push({
            id: roleId,
            allowed: permissions
          });
          permissionsArray.push({
            id: guild.defaultRole.id,
            allowed: permissions // ToDo
          });
          permissionsArray.push({
            id: APP_ID,
            allowed: permissions
          });
        }

        return permissionsArray;
      })
      .catch(error => {
        throw error;
      });
  }

  assignToDivision(message: Discord.Message, options: string) {
    const guild = message.guild;
    const configADO = new BotDBWrapper();

    if (!guild) {
      return;
    }

    Helpers.isAdminChannel(message).then(isIt => {
      if (!!isIt && !!isIt.result) {
        const [division, members] = options.split(" ");

        if (!division) {
          return;
        } else if (
          !guild.channels.find(
            channel => channel.name.toLowerCase() === division.toLowerCase()
          )
        ) {
          message.channel.send(division + " channel not found.");
          return;
        } else if (
          !guild.roles.find(
            channel => channel.name.toLowerCase() === division.toLowerCase()
          )
        ) {
          message.channel.send(division + " role not found.");
          return;
        }

        const divisionRole = guild.roles.find(role => role.name === division);
        const userList = [],
          userNameList = [];

        if (message.mentions.members.array().length > 1) {
          message.mentions.members.array().forEach(member => {
            if (member.id != APP_ID) {
              member.addRole(divisionRole);
              userList.push(member.displayName);
              userNameList.push(
                member.user.username + "#" + member.user.discriminator
              );
            }
          });
        } else if (message.content.lastIndexOf("#") !== -1) {
          const memberList = message.content
            .split("assign-division " + division + " ")[1]
            .split(" ");
          const members = guild.members.array();

          for (let member of memberList) {
            for (let guildMember of members) {
              if (
                guildMember.user.username == member.split("#")[0] &&
                guildMember.user.discriminator == member.split("#")[1]
              ) {
                guildMember.addRole(divisionRole);
                userList.push(guildMember.displayName);
                userNameList.push(
                  guildMember.user.username +
                  "#" +
                  guildMember.user.discriminator
                );
              }
            }
          }
        } else {
          const memberList = message.content
            .split("assign-division " + division + " ")[1]
            .split(",");
          const members = guild.members.array();

          for (let member of memberList) {
            for (let guildMember of members) {
              let foundInGuild = false;
              let parsedId;

              if (member.startsWith("<@")) {
                parsedId = member.replace("<@", "").replace(">", "");

                foundInGuild = !!guild.members.find(
                  member => member.user.id === parsedId
                );
              }

              if (!!foundInGuild || guildMember.user.username == member) {
                guildMember.addRole(divisionRole);
                userList.push(guildMember.displayName);
                userNameList.push(
                  guildMember.user.username +
                  "#" +
                  guildMember.user.discriminator
                );
              } else if (!!parsedId && !foundInGuild) {
                userList.push(member);
                userNameList.push(member);
                break;
              }
            }
          }
        }

        if (userList.length > 0) {
          message.channel.send(
            "Users " +
            userList.join(", ") +
            " added to the " +
            division +
            " division!"
          );

          configADO
            .getDivisionData(guild.id, null, division)
            .then(existentDivision => {
              if (existentDivision) {
                configADO.setDivisionData(
                  guild.id,
                  existentDivision.divisionId,
                  ["members"],
                  [userNameList.join(",")]
                );
              } else {
                console.error("Something happened");
              }
            });
        } else {
          message.channel.send("No user was assigned to the role/division");
        }
      }
    });
  }

  gameOn(message: Discord.Message, args: string) {
    const guild = message.guild;
    const configADO = new BotDBWrapper();

    if (!guild) {
      return;
    }

    Helpers.isAdminChannel(message).then(isIt => {
      if (!!isIt && !!isIt.result) {
        if (!args) {
          message.react("👎");
          message.channel.send(
            L10n[isIt.language].ERRORS.GAME_ON_MISSING_PARAMETERS
          );
          return;
        }

        const [division, members] = args.split(" ");

        if (!division) {
          return;
        } else if (
          !guild.channels.find(
            channel => channel.name.toLowerCase() === division.toLowerCase()
          )
        ) {
          message.react("👎");
          message.channel.send(
            L10n[isIt.language].ERRORS.DIVISION_NOT_FOUND.replace(
              "%1",
              division
            )
          );
          return;
        } else if (
          !guild.roles.find(
            role => role.name.toLowerCase() === division.toLowerCase()
          )
        ) {
          message.react("👎");
          message.channel.send(
            L10n[isIt.language].ERRORS.DIVISION_NOT_FOUND.replace(
              "%1",
              division
            )
          );
          return;
        }

        const divisionRole = guild.roles.find(
          role => role.name.toLowerCase() === division.toLowerCase()
        );
        const divisionChannel = guild.channels.find(
          channel => channel.name.toLowerCase() === division.toLowerCase()
        );

        let memberList = [];

        if (message.content.split("game-on " + division + " ").length >= 2) {
          memberList =
            message.content.split("game-on " + division + " ")[1] &&
            message.content.split("game-on " + division + " ")[1].split(" ");
        }

        if (memberList.length < 2) {
          configADO
            .getDivisionData(guild.id, null, division)
            .then(existingDivision => {
              if (existingDivision) {
                memberList =
                  existingDivision.members &&
                  existingDivision.members.split(",");

                if (!memberList) {
                  message.react("👎");
                  message.channel.send(
                    L10n[isIt.language].ERRORS.GAME_ON_EMPTY_DIVISION
                  );
                  return;
                }

                const shuffleArray = memberList
                  .map(a => [Math.random(), a])
                  .sort((a, b) => a[0] - b[0])
                  .map(a => a[1]);
                let userNames = memberList;

                configADO
                  .setDivisionData(
                    guild.id,
                    existingDivision.divisionId,
                    ["pickOrder"],
                    [shuffleArray.join(",")]
                  )
                  .then(value => {
                    userNames = [];

                    shuffleArray.forEach(shuffled => {
                      let [username, disc] = shuffled.split("#");

                      let taggeableUser = guild.members.find(
                        member =>
                          member.user.username == username &&
                          member.user.discriminator == disc
                      );

                      if (shuffled.startsWith("<@")) {
                        userNames.push(shuffled);
                      } else if (taggeableUser && taggeableUser.user.id) {
                        userNames.push(taggeableUser.user);
                      }
                    });

                    const answer = `${L10n[isIt.language].GAME_ON_1}<@&${
                      divisionRole.id
                      }>\n\n${L10n[isIt.language].GAME_ON_2}\n\n${userNames.join(
                        "\n"
                      )}\n\n${L10n[isIt.language].GAME_ON_3}`;

                    message.react("👍");
                    (<Discord.TextChannel>divisionChannel).send(answer);
                  });
              }
            });
        } else {
          configADO
            .getDivisionData(guild.id, null, division)
            .then(existingDivision => {
              if (existingDivision) {
                configADO
                  .setDivisionData(
                    guild.id,
                    existingDivision.divisionId,
                    ["pickOrder"],
                    [memberList.join(",")]
                  )
                  .then(value => {
                    const answer = `${L10n[isIt.language].GAME_ON_1}<@&${
                      divisionRole.id
                      }>\n\n${L10n[isIt.language].GAME_ON_2}\n\n${memberList.join(
                        "\n"
                      )}\n\n${L10n[isIt.language].GAME_ON_3}`;

                    message.react("👍");
                    (<Discord.TextChannel>divisionChannel).send(answer);
                  });
              }
            });
        }
      } else {
        message.react("👎");

        if (!!isIt) {
          message.channel.send(L10n[isIt.language].ERRORS.GAME_ON_NOT_ALLOWED);
        } else {
          message.channel.send(L10n.EN.ERRORS.GAME_ON_NOT_ALLOWED);
        }
        return;
      }
    });
  }

  clearDivision(message: Discord.Message, name: string) {
    const guild = message.guild;

    if (!guild) {
      return;
    }

    if (!name) {
      message.channel.send(name + " role not found.");
      return;
    }

    if (!guild.roles.find(role => role.name === name.split(" ")[0])) {
      message.channel.send(name + " role not found.");
      return;
    }

    const divisionRole = guild.roles.find(role => role.name === name);

    let cleared = 0;

    guild.roles.array().forEach((role: Discord.Role) => {
      if (role.id === divisionRole.id) {
        role.delete();
      }
    });

    message.channel.send(name + " role deleted.");
  }

  async addPodAndChannel(message: Message) {
    const { guild, channel, channel: { id } } = message;
    const api = new BackendService();

    // ToDo: Here the permissions + channel check should be made
    const [, catNameOrId, podName, mechanicOrFormat] = message.content.split(" ");

    if (!catNameOrId) {
      channel.send("Tournament " + catNameOrId + " not entered");
      message.react("👎");
      return;
    }

    const tournamentCategoryChannel = await guild.channels.find(channel => channel.id === catNameOrId || channel.name === catNameOrId);

    if (!tournamentCategoryChannel || !tournamentCategoryChannel.id) {
      channel.send("Tournament " + catNameOrId + " not found");
      message.react("👎");
      return;
    }

    if (!podName) {
      channel.send(
        "Both tournament and pod names / IDs must be specified"
      );
      return;
    }

    const existingPodChannel = guild.channels.find(channel => channel.name === podName);

    if (existingPodChannel && existingPodChannel.id) {
      channel.send(podName + " channel already existent.");
      message.react("👎");
      return;
    }

    const newPodRole = await guild.createRole({
      name: podName,
      permissions: [
        "SEND_MESSAGES",
        "READ_MESSAGES",
        "READ_MESSAGE_HISTORY",
        "EMBED_LINKS",
        "ATTACH_FILES",
        "ADD_REACTIONS"
      ]
    });

    let permissions = [];

    if (!newPodRole || !newPodRole.id) {
      channel.send(`The role could not be created, please create it manually.`);
    } else {
      newPodRole.setMentionable(true);
      const divisionPermissions = await this.getPermissions(guild, "DIVISION", newPodRole.id);

      permissions = [...divisionPermissions];
    }

    const divisionChannel = await guild.createChannel(podName, "text", permissions);

    if (!divisionChannel) {
      channel.send(`${podName} channel could not be created, please create it manually.`);
      message.react("👎");
      return;
    }

    divisionChannel.setParent(tournamentCategoryChannel.id);

    let mechanic = '', mechanicFormat = '';

    if (!!mechanicOrFormat) {
      let formatted = mechanicOrFormat.toLowerCase();
      if (formatted === 'pvp' || formatted === 'pve') {
        mechanic = formatted;
      } else if (formatted === 'great' || formatted === 'ultra' || formatted === 'master') {
        mechanic = 'pvp';
        mechanicFormat = formatted;
      } else if (formatted === 'solo' || formatted === 'team' || formatted === 'custom') {
        mechanic = 'pve';
        mechanicFormat = formatted;
      }
    }

    const newPod = await api.createPod({
      tournamentId: tournamentCategoryChannel.id,
      id: divisionChannel.id,
      name: podName,
      mechanic,
      mechanicFormat,
    });

    if (newPod) {
      if (newPod.mechanicFormat) {
        const createdEmbed = new RichEmbed();
        createdEmbed.setTitle(`**${newPod.name}** pod created!`)
          .setColor(0x00FF00)
          .setFooter(this.footer.text, this.footer.icon)
          .setThumbnail(mechanicFormatsImgUrl[newPod.mechanicFormat || newPod.mechanic])
          .setDescription(`You can always check this pod thorough details on https://pogoraids.github.io/web/tournament/${newPod.tournamentId}/pod/${newPod.id}`);

        channel.send(createdEmbed);
      } else {
        channel.send(`Pod **${podName}** and role created!`);
      }
      message.react("👍");
    } else {
      channel.send(`The pod could not be saved to the tournament. Please check the logs and try again.`);
      message.react("👎");
    }
  }

  async linkExistingChannelWithNewPod(message: Message) {
    const { guild, channel, channel: { id } } = message;
    const api = new BackendService();

    // ToDo: Here the permissions + channel check should be made
    const [, catNameOrId, podName, mechanicOrFormat] = message.content.split(" ");

    if (!catNameOrId) {
      channel.send("Tournament " + catNameOrId + " not entered");
      message.react("👎");
      return;
    }

    const tournamentCategoryChannel = await guild.channels.find(channel => channel.id === catNameOrId || channel.name === catNameOrId);

    if (!tournamentCategoryChannel || !tournamentCategoryChannel.id) {
      channel.send("Tournament " + catNameOrId + " not found");
      message.react("👎");
      return;
    }

    if (!podName) {
      channel.send(
        "Both tournament and pod names / IDs must be specified"
      );
      return;
    }

    const existingPodChannel = guild.channels.find(channel => channel.name === podName);

    if (!existingPodChannel && existingPodChannel.id) {
      channel.send(podName + " channel non existent or not found.");
      message.react("👎");
      return;
    }

    let mechanic = '', mechanicFormat = '';

    if (!!mechanicOrFormat) {
      let formatted = mechanicOrFormat.toLowerCase();
      if (formatted === 'pvp' || formatted === 'pve') {
        mechanic = formatted;
      } else if (formatted === 'great' || formatted === 'ultra' || formatted === 'master') {
        mechanic = 'pvp';
        mechanicFormat = formatted;
      } else if (formatted === 'solo' || formatted === 'team' || formatted === 'custom') {
        mechanic = 'pve';
        mechanicFormat = formatted;
      }
    }

    const newPod = await api.createPod({
      tournamentId: tournamentCategoryChannel.id,
      id: existingPodChannel.id,
      name: podName,
      mechanic,
      mechanicFormat,
    });

    if (newPod) {
      if (newPod.mechanicFormat) {
        const createdEmbed = new RichEmbed();
        createdEmbed.setTitle(`**${newPod.name}** pod created!`)
          .setColor(0x0000FF)
          .setFooter(this.footer.text, this.footer.icon)
          .setThumbnail(mechanicFormatsImgUrl[newPod.mechanicFormat || newPod.mechanic])
          .setDescription(`The existing channel <@${newPod.id}> was added to the current tournament.\nYou can always check this pod thorough details on https://pogoraids.github.io/web/tournament/${newPod.tournamentId}/pod/${newPod.id}`);

        channel.send(createdEmbed);
      } else {
        channel.send(`Pod **${podName}** created!`);
      }
      message.react("👍");
    } else {
      channel.send(`The pod could not be saved to the tournament. Please check the logs and try again.`);
      message.react("👎");
    }
  }

  async updatePodData(message: Message) {
    const { guild, channel, channel: { id } } = message;
    const api = new BackendService();

    // ToDo: Here the permissions + channel check should be made
    const [commandName, podNameOrId, ...rest] = message.content.split(" ");

    if (!podNameOrId) {
      channel.send("Pod name / ID not entered");
      message.react("👎");
      return;
    }

    const tournamentCategoryChannel = await guild.channels.find(channel => channel.id === podNameOrId || channel.name === podNameOrId);

    if (!tournamentCategoryChannel || !tournamentCategoryChannel.id) {
      channel.send("Pod " + podNameOrId + " not found");
      message.react("👎");
      return;
    }

    const availableUpdates = ['name', 'mechanic', 'multiPod', 'iconImageUrl', 'userId', 'tournamentId'];
    const request: any = {};

    for (const update of rest) {
      let [key, value] = update.split('=');
      // ToDo: handle spaces with double quotes
      if (message.content.includes('"')) {

      }

      if (commandName.includes('-')) {
        const parts = commandName.split('-'); 
        key = parts[parts.length - 1];
        value = update;
      }

      if (availableUpdates.findIndex(u => u === key) === -1) {
        channel.send(`Update ${key} not available. `);
        return;
      }

      request[key] = value;

      if (value.toLowerCase() === 'great' || value.toLowerCase() === 'ultra' || value.toLowerCase() === 'master') {
        request['mechanicFormat'] = value.toLowerCase();
        request['mechanic'] = 'pvp';
      } else if (value.toLowerCase() === 'solo' || value.toLowerCase() === 'team' || value.toLowerCase() === 'custom') {
        request['mechanicFormat'] = value.toLowerCase();
        request['mechanic'] = 'pve';
      }
    }

    request.id = tournamentCategoryChannel.id;
    const updatedPod = await api.updatePod(tournamentCategoryChannel.id, request);

    if (updatedPod) {
      if (updatedPod.mechanicFormat) {
        const createdEmbed = new RichEmbed();
        createdEmbed.setTitle(`**${updatedPod.name}** pod updated!`)
          .setColor(0x0000FF)
          .setFooter(this.footer.text, this.footer.icon)
          .setThumbnail(mechanicFormatsImgUrl[updatedPod.mechanicFormat || updatedPod.mechanic] || mechanicFormatsImgUrl[updatedPod.mechanic])
          .setDescription(`The existing pod data was updated.\nYou can always check this pod thorough details on https://pogoraids.github.io/web/tournament/${updatedPod.tournamentId}/pod/${updatedPod.id}`);

        channel.send(createdEmbed);
      } else {
        channel.send(`Pod **${updatedPod.name}** updated!`);
      }
      message.react("👍");
    } else {
      channel.send(`The pod data could not be updated. Please check the logs and try again.`);
      message.react("👎");
    }
  }
}
