import {Channels} from './channels';
import * as Discord from 'discord.js';
const ID = '498873323682529301';

const commands = ['create-draft', 'create-division'];

export class Listener {
	constructor(private client: Discord.Client) {
	}

	parse(message: Discord.Message) {
		if (!message.guild) return;
		const summoned: Discord.User = message.mentions && message.mentions.users && message.mentions.users.first();
		
		if (!!summoned && summoned.id === ID || message.content.lastIndexOf('<@' + ID + '>') === 0) {
			if (message.content.lastIndexOf('create-draft') !== -1) {
				new Channels().createDraft(message, message.content.split('create-draft ')[1]);
			} else if (message.content.lastIndexOf('create-division') !== -1) {
				new Channels().createDivision(message, message.content.split('create-division ')[1]);
			} else if (message.content.lastIndexOf('assign-division') !== -1)  {
				new Channels().assignToDivision(message, message.content.split('assign-division ')[1]);
			}
			//message.reply('KHE?!');
		}
	}
}