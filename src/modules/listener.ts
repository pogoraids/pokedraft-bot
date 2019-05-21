import { Channels } from "./channels";
import { Configuration } from "./configuration";
import * as Discord from "discord.js";
const ID = "498873323682529301";

const commands = [
  "create-draft",
  "create-division",
  "assign-division",
  "standings",
  "help",
  "game-on"
];

export class Listener {
  constructor() {}

  parse(message: Discord.Message) {
    if (!message.guild) return;
    const summoned: Discord.User =
      message.mentions &&
      message.mentions.users &&
      message.mentions.users.find(bot => bot.id == ID);

    if (
      (!!summoned && summoned.id === ID) ||
      message.content.lastIndexOf("<@" + ID + ">") === 0 ||
      !!message.content.startsWith('&')
    ) {
      if (message.content.lastIndexOf("create-draft") !== -1) {
        new Channels().createDraft(
          message,
          message.content.split("create-draft ")[1]
        );
      } else if (message.content.lastIndexOf("create-division") !== -1) {
        new Channels().createDivision(
          message,
          message.content.split("create-division ")[1]
        );
      } else if (message.content.lastIndexOf("assign-division") !== -1) {
        new Channels().assignToDivision(
          message,
          message.content.split("assign-division ")[1]
        );
      } else if (message.content.lastIndexOf("help") !== -1) {
        new Configuration().getHelpMessage(message);
      } else if (message.content.lastIndexOf("game-on") !== -1) {
        new Channels().gameOn(message, message.content.split("game-on ")[1]);
      } else if (message.content.lastIndexOf("clear-division") !== -1) {
        new Channels().clearDivision(
          message,
          message.content.split("clear-division ")[1]
        );
      } else if (message.content.lastIndexOf("get-config") !== -1) {
        new Configuration().getConfigData(message);
      } else if (message.content.lastIndexOf("set-config") !== -1) {
        new Configuration().setConfigData(
          message,
          message.content.split("set-config ")[1]
        );
      } else if (message.content.lastIndexOf("division-info") !== -1) {
        new Configuration().divisionInfo(message);
      } else if (message.content.lastIndexOf("draft-info") !== -1) {
        new Configuration().getDraftDivisions(message);
      } else if (message.content.lastIndexOf("drop-division") !== -1) {
        new Configuration().dropDivision(
          message,
          message.content.split("drop-division ")[1]
        );
      } else if (
        message.content.lastIndexOf("standings") !== -1 ||
        message.content.lastIndexOf("scores") !== -1
      ) {
        new Configuration().getMasterStandings(message);
      }
    }
  }
}
