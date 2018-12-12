import * as sql from "sqlite";
import * as Discord from "discord.js";
import { BotDBWrapper } from "../utils/sqlite/botDbWrapper";
import { Helpers } from "../utils/helpers";
import * as L10n from "../constants/messages";
export class Configuration {
  constructor(private db?: sql.Database) {}

  getHelpMessage(message: Discord.Message) {
    new BotDBWrapper().getLanguage(message.guild.id).then(lang => {
      const LANG = lang.toUpperCase();

      if (L10n.hasOwnProperty(LANG)) {
        message.channel.send(L10n[LANG].HELP);
      } else {
        message.channel.send(L10n.EN.HELP);
      }
    });
  }

  getConfigData(message: Discord.Message) {
    const guild = message.guild;

    if (!guild) {
      return;
    }

    new BotDBWrapper().getGuildData(guild.id, guild.name).then(rowValue => {
      if (rowValue) {
        message.channel.send(`
This server ${rowValue.guildName} has the following configurations:

- Admin channel: ${rowValue.adminChannel}
- Language: ${rowValue.language}
- Roles allowed to use the bot: ${rowValue.rolesAllowed}
- Master standings / rules sheet: <${rowValue.masterSheet || "_Empty_"}>

Set any configuration using \`set-config\` \`config\` \`newValue\`.
`);
      } else {
        console.log(`Error getting config data`);
      }
    });
  }

  setConfigData(message: Discord.Message, text: string) {
    const guild = message.guild;

    if (!guild) {
      return;
    }
    let [property, value, rest] = text.split(" ");

    if (property === "rolesAllowed") {
      let newValue = text
        .split(" ")
        .slice(1)
        .join(" ");
      const rolesArray = newValue.split(",");
      const roleIds = [];

      if (rolesArray && rolesArray.length) {
        for (const role of rolesArray) {
          const serverRole = guild.roles.find(
            guildRole => guildRole.name == role
          );

          if (serverRole) {
            roleIds.push(serverRole.id);
          }
        }

        value = roleIds.join(",");
      }
    }

    new BotDBWrapper()
      .setGuildData(guild.id, property, value)
      .then(rowValue => {
        message.channel.send(
          `This server ${guild.name} updated ${property} to ${value}`
        );
      });
  }

  getMasterStandings(message: Discord.Message) {
    const guild = message.guild;

    if (!guild) {
      return;
    }

    new BotDBWrapper().getGuildData(guild.id, guild.name).then(rowValue => {
      if (rowValue) {
        message.react("👍");
        message.channel.send(`
You can find this current Draft standings' / rules' sheet here: <${rowValue.masterSheet ||
          "_Empty_"}>
`);
      } else {
        console.log(`Error getting config data`);
      }
    });
  }

  divisionInfo(message: Discord.Message) {
    const guild = message.guild;

    if (!guild) {
      return;
    }

    const [, , divisionName] = message.content.split(" ");

    if (!divisionName) {
      message.react("👎");
      message.channel.send(
        `Division ${divisionName} is not on the current draft (or server)`
      );
      return;
    }

    new BotDBWrapper()
      .getDivisionData(guild.id, null, divisionName)
      .then(rowValue => {
        if (rowValue) {
          message.react("👍");
          message.channel.send(`
The division **${rowValue.divisionName}** has the following:

- **Members**: ${(rowValue.members && rowValue.members.split(",").join(", ")) ||
            "_Still empty_"}
- **Draft pick order**: ${(rowValue.pickOrder &&
            rowValue.pickOrder.split(",").join("\t\n ->")) ||
            "_Still empty_"}

`);
        } else {
          message.react("👎");
          message.channel.send(`No data found for **${divisionName}**`);
        }
      });
  }

  getDraftDivisions(message: Discord.Message) {
    const guild = message.guild;

    if (!guild) {
      return;
    }

    new BotDBWrapper()
      .getAllDivisionsFromGuild(guild.id)
      .then((data: any[]) => {
        if (data) {
          const draftData = [];
          data.forEach(rowValue => {
            draftData.push(`\tDivision **${rowValue.divisionName}**
**===**
	**Members**: ${(rowValue.members && rowValue.members.split(",").join(", ")) ||
    "_Still empty_"}
	**Draft pick order**:  ${(rowValue.pickOrder &&
    "\n\t ->" + rowValue.pickOrder.split(",").join("\n\t -> ")) ||
    "_Still empty_"}\n`);
          });

          if (draftData.length === 0) {
            message.channel.send(`
	The current draft for **${
    guild.name
  }** has the following divisions: _No divisions yet_
	`);
          } else {
            message.channel.send(`
		The current draft for **${guild.name}** has the following divisions:
		`);

            if (draftData.join("\n").length > 2000) {
              draftData.forEach(division => {
                message.channel.send(division);
              });
            } else {
              message.channel.send(draftData.join("\n"));
            }
          }
        }
      });
  }

  // ToDo: refactor to a upper module apart from the ADO
  dropDivision(message: Discord.Message, args: string) {
    const guild = message.guild;

    if (!guild) {
      return;
    }

    const [, , divisionName] = message.content.split(" ");

    Helpers.isAdminChannel(message).then(isIt => {
      if (!!isIt && !!isIt.result) {
        if (!divisionName) {
          message.react("👎");
          message.channel.send(
            L10n[isIt.language].ERRORS.DROP_DIVISION_NOT_FOUND.replace(
              "%1",
              divisionName
            )
          );
          return;
        }

        new BotDBWrapper()
          .getDivisionData(guild.id, null, divisionName)
          .then(rowValue => {
            if (rowValue) {
              new BotDBWrapper()
                .dropDivisionData(guild.id, rowValue.divisionId)
                .then(err => {
                  message.react("👍");
                  message.channel.send(
                    L10n[isIt.language].DROP_DIVISION_ANSWER.replace(
                      "%1",
                      rowValue.divisionName
                    )
                  );
                });
            } else {
              message.react("👎");
              message.channel.send(
                L10n[isIt.language].ERRORS.DROP_DIVISION_NO_DATA.replace(
                  "%1",
                  divisionName
                )
              );
            }
          });
      } else {
        message.react("👎");

        if (!!isIt) {
          message.channel.send(
            L10n[isIt.language].ERRORS.DROP_DIVISION_NOT_ALLOWED
          );
        } else {
          message.channel.send(L10n.EN.ERRORS.DROP_DIVISION_NOT_ALLOWED);
        }
      }
    });
  }
}
