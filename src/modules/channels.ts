import * as Discord from 'discord.js';
import {GAME_ON_1, GAME_ON_2, GAME_ON_3} from '../constants/messages';
import {APP_ID} from '../constants/app';
import {Configuration} from './configuration';

export class Channels {	
	constructor() {
	}

	createDraft(message: Discord.Message, name: string, members?: Discord.GuildMember[]) {
		const guild = message.guild;
		
		if (!guild) return;
		
		new Configuration().getGuildData(guild.id).then(configData => {
			if (configData) {
				let authorizedRoles = configData.rolesAllowed.split(',');
				let guildMember = guild.members.find(member => message.author.id == member.id);

				if (!guildMember.roles.find(role => role.hasPermissions('ADMINISTRATOR'))) {
					console.log('User doesn\'t have the ADMINISTRATOR role');

					let found = false;
					
					for (const authRole of authorizedRoles) {
						if (guildMember.roles.find(role => role.id === authRole)) {
							found = true;
							break;
						}
					}

					if (!found) {
						message.channel.send('You cannot use `create-draft` here or you don\'t have enough permissions.');
						return;
					}
				}
				
				if (guild.channels.find(channel => channel.name === name)) {
					message.channel.send(name + ' category already existent.');
				} else {
					this.getPermissions(guild, 'HIDDEN').then((categoryPermissions) => {
						guild.createChannel(name, 'category', categoryPermissions)
							.then((category: Discord.CategoryChannel) => {
							message.channel.send('Category ' + name + ' created!');
						});
					});			
				}
			} else {
				message.channel.send(`No server config established (namely rolesAllowed). Please do so with set-config`);
			} 
		});
	}

	createDivision(message: Discord.Message, name: string, members?: Discord.GuildMember[]) {
		const guild = message.guild;
		
		if (!guild) return;
		
		new Configuration().getGuildData(guild.id).then(configData => {
			let authorizedRoles = configData.rolesAllowed.split(',');
			let guildMember = guild.members.find(member => message.author.id == member.id);

			if (!guildMember.roles.find(role => role.hasPermissions('ADMINISTRATOR'))) {
				console.log('User doesn\'t have the ADMINISTRATOR role');

				let found = false;
				
				for (const authRole of authorizedRoles) {
					if (guildMember.roles.find(role => role.id === authRole)) {
						found = true;
						break;
					}
				}

				if (!found) {
					message.channel.send('You cannot use `create-division` here or you don\'t have enough permissions.');
					return;
				}
			}

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
					role.setMentionable(true);

					this.getPermissions(guild, 'DIVISION', role.id).then(divisionPermissions => {
						let permissions = [...divisionPermissions];
						
						guild.createChannel(division, 'text', permissions).then((divisionChannel) => {
							divisionChannel.setParent(catObject.id);
		
							message.channel.send('Division ' + division + ' and role created!');

							new Configuration().getAllDivisionsFromGuild(guild.id).then((data: any[]) => {
								if (!data) {
									new Configuration().setDivisionData(guild.id, '1', ['divisionName'], [division]);
								} else {
									new Configuration().setDivisionData(guild.id, "" + (data.length + 1), ['divisionName'], [division]);
								}
							})
						});
					});
				});
			}
		});
	}

	createBotChannel(client: Discord.Client, db: any) {
		const guild = client.guilds.first();

		if (!guild) { return; }
		if (!db) { console.error('NO DB!'); return; }

		for (let guild of client.guilds.array()) {
			if (!guild.channels.find(channel => channel.name === "draftbot-admin")) {
				const role = guild.roles.find(role => role.hasPermission([Discord.Permissions.FLAGS.ADMINISTRATOR]));
				this.getPermissions(guild, 'ADMIN', role.id).then(adminPermissions => {

					const botChannelPermissions = [...adminPermissions];

					guild.createChannel('draftbot-admin', 'text', botChannelPermissions)
						.then((channel: Discord.GuildChannel) => {					
						console.log('Admin channel created for guild: ' + guild.name);
						new Configuration(db).createGuildCatalog();
						new Configuration(db).createDivisionCatalog();
					});
				})
				
			} else {
				console.log('Admin channel already created on ' + guild.name);
				
				/*db.get('select * from GuildCatalog').then(v=>{
					console.log(v);
				})*/
				
				new Configuration().getGuildData(guild.id, guild.name)/*.then((a) => {
					console.log('AAAA', a);
				})*/
			}
		}
	}

	getPermissions(guild: Discord.Guild, mode: 'HIDDEN' | 'ADMIN' | 'DIVISION', roleId?: string) {
		let permissions = ['SEND_MESSAGES','READ_MESSAGES', "READ_MESSAGE_HISTORY"];
		let permissionObj: { allowed?: string[], denied?: string[], id?: string} = {};
		let permissionsArray = [];

		return new Configuration().getGuildData(guild.id).then((rowData) => {
			if (rowData.rolesAllowed) {
				rowData.rolesAllowed.split(',').forEach((configRole) => {
					permissionsArray.push({
						id: configRole,
						allowed: [...permissions, 'ADD_REACTIONS']
					});
				});
			}

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
		}).catch((error) => {
			throw error;
		});
	}

	assignToDivision(message: Discord.Message, options: string) {
		const guild = message.guild;
		const configADO = new Configuration();
		
		if (!guild) { return; }
		
		const [division, members] = options.split(' ');
		
		if (!division) { return; }
		else if (!guild.channels.find(channel => channel.name.toLowerCase() === division.toLowerCase())) { 
			message.channel.send(division + ' channel not found.');
			return;
		} else if (!guild.roles.find(channel => channel.name.toLowerCase() === division.toLowerCase())) {
			message.channel.send(division + ' role not found.');
			return; 
		}

		const divisionRole = guild.roles.find(role => role.name === division);
		const userList = [], userNameList = [];
		
		if (message.mentions.members.array().length > 1) {
			message.mentions.members.array().forEach((member) => {
				if (member.id != APP_ID) {
					member.addRole(divisionRole);
					userList.push(member.displayName);
					userNameList.push(member.user.username + '#' + member.user.discriminator);
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
						userNameList.push(guildMember.user.username + '#' + guildMember.user.discriminator);
					}
				}
			}
		}
		
		if (userList.length > 0) {
			message.channel.send('Users ' + userList.join(', ') + ' added to the ' + division + ' division!');
			
			configADO.getDivisionData(guild.id, null, division).then((existentDivision) => {
				if (existentDivision) {
					configADO.setDivisionData(guild.id, existentDivision.divisionId, ['members'], [userNameList.join(',')]);
				} else {
					console.error('Something happened');
				}
			});
		} else {
			message.channel.send('No user was assigned to the role/division');
		}
	}

	gameOn(message: Discord.Message, name: string) {
		const guild = message.guild;
		const configADO = new Configuration();

		if (!guild) { return; }

		const [division, members] = name.split(' ');

		if (!division) { return; }
		else if (!guild.channels.find(channel => channel.name.toLowerCase() === division.toLowerCase())) { 
			message.channel.send(division + ' channel not found.');
			return;
		} else if (!guild.roles.find(role => role.name.toLowerCase() === division.toLowerCase())) {
			message.channel.send(division + ' role not found.');
			return; 
		}

		const adminChannel = guild.channels.find(channel => channel.name === 'draftbot-admin');
		
		if (adminChannel && adminChannel.id != message.channel.id) {
			message.channel.send('You cannot use the command `game-on` here.');
			return;
		}

		const divisionRole = guild.roles.find(role => role.name.toLowerCase() === division.toLowerCase());
		const divisionChannel = guild.channels.find(channel => channel.name.toLowerCase() === division.toLowerCase());
		
		let memberList = [];
		
		if(message.content.split('game-on ' + division + ' ').length >= 2) {
			memberList = message.content.split('game-on ' + division + ' ')[1].split(' ');
		}

		if (memberList.length < 2) {
			configADO.getDivisionData(guild.id, null, division).then(existingDivision => {
				if (existingDivision) {
					memberList = existingDivision.members.split(',');					
					
					const shuffleArray = memberList.map((a) => [Math.random(),a]).sort((a,b) => a[0]-b[0]).map((a) => a[1]);
					let userNames = memberList;
					
					configADO.setDivisionData(guild.id, existingDivision.divisionId, ['pickOrder'], [shuffleArray.join(',')]).then(value => {
						userNames = [];

						shuffleArray.forEach(shuffled => {
							let [username, disc] = shuffled.split('#');

							let taggeableUser = guild.members.find(member => member.user.username == username && member.user.discriminator == disc);
							
							if (taggeableUser && taggeableUser.user.id) {
								userNames.push(taggeableUser.user);
							}
						});
						
						(<Discord.TextChannel>divisionChannel).send(`${GAME_ON_1}<@&${divisionRole.id}>\n\n${GAME_ON_2}\n\n${userNames.join('\n')}\n\n${GAME_ON_3}`);
					});
				}
			});
		} else {
			configADO.getDivisionData(guild.id, null, division).then(existingDivision => {
				if (existingDivision) {
					configADO.setDivisionData(guild.id, existingDivision.divisionId, ['pickOrder'], [memberList.join(',')]).then(value => {
						(<Discord.TextChannel>divisionChannel).send(`${GAME_ON_1}<@&${divisionRole.id}>\n\n${GAME_ON_2}\n\n${memberList.join('\n')}\n\n${GAME_ON_3}`);
					});
				}
			});
		}
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