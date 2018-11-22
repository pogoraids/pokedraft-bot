import {Channels} from './channels';
import { Configuration } from './configuration';
import * as i18nText from '../constants/messages';
import * as Discord from 'discord.js';
const ID = '498873323682529301';

const commands = ['create-draft', 'create-division', 'assign-division', 'standings', 'help', 'game-on'];

export class Listener {
	constructor() {}

	parse(message: Discord.Message) {
		if (!message.guild) return;
		const summoned: Discord.User = message.mentions && message.mentions.users && message.mentions.users.find(bot => bot.id == ID);
		
		if (!!summoned && summoned.id === ID || message.content.lastIndexOf('<@' + ID + '>') === 0) {
			if (message.content.lastIndexOf('create-draft') !== -1) {
				new Channels().createDraft(message, message.content.split('create-draft ')[1]);
			} else if (message.content.lastIndexOf('create-division') !== -1) {
				new Channels().createDivision(message, message.content.split('create-division ')[1]);
			} else if (message.content.lastIndexOf('assign-division') !== -1)  {
				new Channels().assignToDivision(message, message.content.split('assign-division ')[1]);
			} else if (message.content.lastIndexOf('help') !== -1) {
				new Configuration().getLanguage(message.guild.id).then((lang) => {
					const LANG = lang.toUpperCase();
					
					if (i18nText.hasOwnProperty(LANG)) {
						message.channel.send(i18nText[LANG].HELP);
					}
				})
			} else if (message.content.lastIndexOf('game-on') !== -1) {
				new Channels().gameOn(message, message.content.split('game-on ')[1]);
			} else if (message.content.lastIndexOf('clear-division') !== -1) {
				new Channels().clearDivision(message, message.content.split('clear-division ')[1]);
			} else if (message.content.lastIndexOf('get-config') !== -1) {
				new Configuration().getConfigData(message);
			} else if (message.content.lastIndexOf('set-config') !== -1) {
				new Configuration().setConfigData(message, message.content.split('set-config ')[1]);
			}
		}
	}
}