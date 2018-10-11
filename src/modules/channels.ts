import * as Discord from 'discord.js';
import {GAME_ON_1, GAME_ON_2, GAME_ON_3} from '../constants/messages';
import {APP_ID} from '../constants/app';

export class Channels {	
	constructor() {
	}

	createDraft(message: Discord.Message, name: string, members?: Discord.GuildMember[]) {
		const guild = message.guild;
		
		if (!guild) return;
		
		if (guild.channels.find(channel => channel.name === name)) {
			message.channel.send(name + ' category already existent.');
		} else {
			const categoryPermissions = this.getPermissions(guild, 'HIDDEN');

			guild.createChannel(name, 'category', categoryPermissions)
				.then((category: Discord.CategoryChannel) => {
				message.channel.send('Category ' + name + ' created!');
			})
		}
	}

	createDivision(message: Discord.Message, name: string, members?: Discord.GuildMember[]) {
		const guild = message.guild;
		
		if (!guild) return;
		
		const [category, division] = name.split(' ');
		let catObject = null;
		
		if (!category) {
			message.channel.send('Category ' + category + ' not found');
			return;
		} else {
			catObject = guild.channels.find(channel => channel.name === category);
		}

		if (!division) {
			message.channel.send('Both category and division names must be specified');
			return;
		}

		if (guild.channels.find(channel => channel.name === division)) {
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
				let permissions = [...this.getPermissions(guild, 'DIVISION', role.id)];
				
				guild.createChannel(division, 'text', permissions).then((divisionChannel) => {
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
			if (!guild.channels.find(channel => channel.name === "draftbot-admin")) {
				const role = guild.roles.find(role => role.hasPermission([Discord.Permissions.FLAGS.ADMINISTRATOR]));
				const botChannelPermissions = [...this.getPermissions(guild, 'ADMIN', role.id)];

				guild.createChannel('draftbot-admin', 'text', botChannelPermissions)
					.then((channel: Discord.GuildChannel) => {					
					console.log('Admin channel created for guild: ' + guild.name);
				});
			} else {
				console.log('Admin channel already created on ' + guild.name);
			}
		}
	}

	getPermissions(guild: Discord.Guild, mode: 'HIDDEN' | 'ADMIN' | 'DIVISION', roleId?: string) {
		let permissions = ['SEND_MESSAGES','READ_MESSAGES', "READ_MESSAGE_HISTORY"];
		let permissionObj: { allowed?: string[], denied?: string[], id?: string} = {};
		let permissionsArray = [];

		if (mode === 'HIDDEN') {
			permissionsArray.push({
				id: guild.defaultRole.id,
				denied: permissions
			});
			permissionsArray.push({
				id: APP_ID,
				allowed: permissions
			});
		} else if (mode === 'ADMIN') {
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
		} else if (mode === 'DIVISION') {
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
		}
		
		return permissionsArray;
	}

	assignToDivision(message: Discord.Message, options: string) {
		const guild = message.guild;
		
		if (!guild) { return; }
		
		const [division, members] = options.split(' ');

		if (!division) { return; }
		else if (!guild.channels.find(channel => channel.name === division)) { 
			message.channel.send(division + ' channel not found.');
			return;
		} else if (!guild.roles.find(channel => channel.name === division)) {
			message.channel.send(division + ' role not found.');
			return; 
		}

		const divisionRole = guild.roles.find(role => role.name === division);
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
		else if (!guild.channels.find(channel => channel.name === division)) { 
			message.channel.send(division + ' channel not found.');
			return;
		} else if (!guild.roles.find(role => role.name === division)) {
			message.channel.send(division + ' role not found.');
			return; 
		}

		const divisionRole = guild.roles.find(role => role.name === division);
		const divisionChannel = guild.channels.find(channel => channel.name === division);
		
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
		
		if (!guild.roles.find(role => role.name === name.split(' ')[0])) {
			message.channel.send(name + ' role not found.');
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
}