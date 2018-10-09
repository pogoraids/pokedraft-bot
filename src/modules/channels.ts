import * as Discord from 'discord.js';
import {GAME_ON_1, GAME_ON_2, GAME_ON_3} from '../constants/messages';
import {APP_ID} from '../constants/app';

export class Channels {	
	constructor() {
	}

	createDraft(message: Discord.Message, name: string, members?: Discord.GuildMember[]) {
		const guild = message.guild;
		
		if (!guild) return;
		
		const everyone = this.getEveryone(guild);
		
		if (guild.channels.find('name', name)) {
			message.channel.send(name + ' category already existent.');
		} else {
			guild.createChannel(name, 'category', [{
				id: APP_ID,
				allowed: ['SEND_MESSAGES','READ_MESSAGES', "READ_MESSAGE_HISTORY"]
			}, {
				id: everyone.id,
				denied: ['SEND_MESSAGES','READ_MESSAGES', "READ_MESSAGE_HISTORY"]
			}]).then((category: Discord.CategoryChannel) => {
				message.channel.send('Category ' + name + ' created!');
			})
		}
	}

	createDivision(message: Discord.Message, name: string, members?: Discord.GuildMember[]) {
		const guild = message.guild;
		
		if (!guild) return;
		
		const [category, division] = name.split(' ');
		let catObject = null;
		const everyone = this.getEveryone(guild);
		
		if (!category) {
			message.channel.send('Category ' + category + ' not found');
			return;
		} else {
			catObject = guild.channels.find('name', category);
		}

		if (!division) {
			message.channel.send('Both category and division names must be specified');
			return;
		}

		if (guild.channels.find('name', division)) {
			message.channel.send(division + ' channel already existent.');
		} else {
			if (!catObject) {
				message.channel.send('Category ' + category + ' not found');
				return;
			}

			guild.createRole({
				name: division,
				permissions: ['SEND_MESSAGES','READ_MESSAGES', "READ_MESSAGE_HISTORY", "EMBED_LINKS", 'ATTACH_FILES', 'ADD_REACTIONS']
			}).then((role: Discord.Role) => {
				guild.createChannel(division, 'text', [{
					id: APP_ID,
					allowed: ['SEND_MESSAGES','READ_MESSAGES', "READ_MESSAGE_HISTORY"]
				}, {
					id: role.id,
					allowed: ['SEND_MESSAGES','READ_MESSAGES', "READ_MESSAGE_HISTORY", "EMBED_LINKS", 'ATTACH_FILES', 'ADD_REACTIONS']
				}, {
					id: everyone.id,
					denied: ['SEND_MESSAGES','READ_MESSAGES', "READ_MESSAGE_HISTORY"]
				}]).then((divisionChannel) => {
					divisionChannel.setParent(catObject.id);

					message.channel.send('Division ' + division + ' and role created!');
				});
			})
			
		}
	}

	createBotChannel(client: Discord.Client) {
		const guild = client.guilds.first();

		if (!guild) { return; }

		for (let guild of client.guilds.array()) {

			if (!guild.channels.find("name","draftbot-admin")) {
				const role = guild.roles.find(role => role.hasPermission([Discord.Permissions.FLAGS.ADMINISTRATOR]));
				const everyone = this.getEveryone(guild);
				// ToDo: remove overwrite and add permissions in the same call
				guild.createChannel('draftbot-admin', 'text').then((channel: Discord.GuildChannel) => {
					channel.overwritePermissions(APP_ID, {
						SEND_MESSAGES: true,
						READ_MESSAGE_HISTORY: true,
						READ_MESSAGES: true
					});
					channel.overwritePermissions(everyone.id, {
						READ_MESSAGES: false,
						SEND_MESSAGES: false,
						READ_MESSAGE_HISTORY: false
					});
					channel.overwritePermissions(role.id, {
						SEND_MESSAGES: true,
						READ_MESSAGE_HISTORY: true,
						READ_MESSAGES: true
					});
				});
			} else {
				console.log('Admin channel already created');
			}
		}
	}

	getEveryone(guild: Discord.Guild) {
		return guild.roles.find(role => role.name === "@everyone");
	}

	assignToDivision(message: Discord.Message, options: string) {
		const guild = message.guild;
		
		if (!guild) { return; }
		
		const [division, members] = options.split(' ');

		if (!division) { return; }
		else if (!guild.channels.find('name', division)) { 
			message.channel.send(division + ' channel not found.');
			return;
		} else if (!guild.roles.find('name', division)) {
			message.channel.send(division + ' role not found.');
			return; 
		}

		const divisionRole = guild.roles.find('name', division);
		const userList = [];
		
		if (message.mentions.members.array().length > 1) {
			message.mentions.members.array().forEach((member) => {
				if (member.id != APP_ID) {
					member.addRole(divisionRole);
					userList.push(member.displayName);
				}
			});
		} else if (message.content.lastIndexOf("#") !== -1) {
			const memberList = message.content.split('assign-division ' + division + ' ')[1].split(' ');
			const members = guild.members.array();
			
			for (let member of memberList) {
				for (let guildMember of members) {
					if (guildMember.user.username == member.split('#')[0] && guildMember.user.discriminator == member.split('#')[1]) {
						guildMember.addRole(divisionRole);
						userList.push(guildMember.displayName);
					}
				}
			}
		}
		
		if (userList.length > 0) {
			message.channel.send('Users ' + userList.join(', ') + ' added to the ' + division + ' division!');
		} else {
			message.channel.send('No user was assigned to the role/division');
		}
	}

	gameOn(message: Discord.Message, name: string) {
		const guild = message.guild;
		
		if (!guild) { return; }

		const [division, members] = name.split(' ');

		if (!division) { return; }
		else if (!guild.channels.find('name', division)) { 
			message.channel.send(division + ' channel not found.');
			return;
		} else if (!guild.roles.find('name', division)) {
			message.channel.send(division + ' role not found.');
			return; 
		}

		const divisionRole = guild.roles.find('name', division);
		const divisionChannel = guild.channels.find('name', division);
		
		const memberList = message.content.split('game-on ' + division + ' ')[1].split(' ');

		(<Discord.TextChannel>divisionChannel).send(`${GAME_ON_1}<@&${divisionRole.id}>\n\n${GAME_ON_2}\n\n${memberList.join('\n')}\n\n${GAME_ON_3}`);
	}

	clearDivision(message: Discord.Message, name: string) {
		const guild = message.guild;
		
		if (!guild) { return; }
		
		if (!name) { 
			message.channel.send(name + ' role not found.');
			return; 
		}
		
		if (!guild.roles.find('name', name.split(' ')[0])) {
			message.channel.send(name + ' role not found.');
			return; 
		}

		const divisionRole = guild.roles.find('name', name);

		let cleared = 0;

		guild.roles.array().forEach((role: Discord.Role) => {
			if (role.id === divisionRole.id) {
				role.delete();
			}
		});

		message.channel.send(name + " role deleted.");
	}
}