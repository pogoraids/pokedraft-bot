import * as Discord from 'discord.js';
import { Configuration } from '../modules/configuration';
import { EN } from '../constants/messages';
//import { EN, ES } from '../constants/messages';

export class Helpers {
	static isAdminChannel(message: Discord.Message) {
		return new Configuration().getGuildData(message.guild.id).then(guildData => {
			if (guildData && guildData.adminChannel) {
				const fromConfig = message.guild.channels.find(channel => channel.name === guildData.adminChannel);
				const language = guildData.language && guildData.language.toUpperCase() || 'EN';
				
				return {
					result: fromConfig && fromConfig.id === message.channel.id,
					language: language
				};
			} else {
				const no: Discord.Emoji = message.guild.emojis.find(emoji => emoji.name === 'thumbsdown');
				message.react('👎');
				message.channel.send(EN.ERRORS.MISSING_GUILD_CONFIG);
			}
		}, err => {
			message.react('👎');
			
			return {
				result: false,
				language: 'EN'
			};
		});
	}
}