import * as sql from 'sqlite';
import * as Discord from 'discord.js';
import { CREATE_GUILD, CREATE_DIVISION } from '../constants/dbCatalogs';
import { resolve, dirname } from 'path';

export class Configuration {
	constructor(private db?: sql.Database) {}

	dbInstance(): Promise<sql.Database> {		
		return sql.open(resolve(dirname('.') + '/pokedraft.sqlite')).then((db: sql.Database) => {
			return db;
		});
	}

	createGuildCatalog() {
		return this.dbInstance().then((db) => {
			return db.run(CREATE_GUILD).then(() => {
				console.log('table created');
			}).catch((err) => {
				console.log('CRITICAL ERROR', err);
			});
		});
	}

	registerGuild(id: string, name: string) {
		return this.dbInstance().then((db) => {
			return db.run('INSERT INTO GuildCatalog(guildId, guildName, adminChannel, rolesAllowed, language) VALUES (?, ?, ?, ?, ?)', [id, name, 'draftbot-admin', '', 'en']).then(() => {
				console.log(name + ' guild registered');
			});
		});
	}

	getGuildData(id: string, name?: string) {
		return this.dbInstance().then((db) => {
			return db.get(`SELECT guildName, adminChannel, rolesAllowed, language FROM GuildCatalog WHERE guildId="${id}"`).then((row: any) => {
				if (row) {
					return row;
				} else {
					if (!name) { throw 'Missing Guild Name'; }

					this.registerGuild(id, name);
				}
			}).catch((err) => {
				console.log('ERROR GETTING', err);
			})
		});
	}

	setGuildData(id: string, property: string, value: string) {
		return this.dbInstance().then((db) => {
			return db.run(`UPDATE GuildCatalog SET ${property}="${value}" WHERE guildId = "${id}"`).then(() => {
				console.log('Config updated');
			})
		});
	}

	getConfigData(message: Discord.Message) {
		const guild = message.guild;

		if (!guild) { return; }

		this.getGuildData(guild.id, guild.name).then((rowValue) => {
			if (rowValue) {
			message.channel.send(`
This server ${rowValue.guildName} has the following configurations:

- Admin channel: ${rowValue.adminChannel}
- Language: ${rowValue.language}
- Roles allowed to use the bot: ${rowValue.rolesAllowed}

Set any configuration using \`set-config\` \`config\` \`newValue\`.
`);
			} else {
				console.log(`Error getting config data`);
			}
		});
	}

	setConfigData(message: Discord.Message, text: string) {
		const guild = message.guild;

		if (!guild) { return; }
		let [property, value, rest] = text.split(" ");

		if (property === 'rolesAllowed') {
			let newValue = text.split(' ').slice(1).join(' ');
			const rolesArray = newValue.split(',');
			const roleIds = [];
			
			if (rolesArray && rolesArray.length) {
				for (const role of rolesArray) {
					const serverRole = guild.roles.find(guildRole => guildRole.name == role);					
					
					if (serverRole) {
						roleIds.push(serverRole.id);
					}
				}

				value = roleIds.join(',');
			}
		}

		this.setGuildData(guild.id, property, value).then((rowValue) => {
			message.channel.send(`This server ${guild.name} updated ${property} to ${value}`);
		});
	}

	getLanguage(guildId: string) {
		return this.dbInstance().then((db) => {
			return db.get(`SELECT language FROM GuildCatalog WHERE guildId = "${guildId}"`).then((row) => {
				return row.language;
			});
		});
	}

	createDivisionCatalog() {
		return this.db.run(CREATE_DIVISION).then(() => {
			console.log('division table created');
		}).catch((err) => {
			console.log('CRITICAL ERROR', err);
		});
	}

	getAllDivisionsFromGuild(id: string, name?: string) {
		return new Promise((resolve, reject) => {
			this.dbInstance().then((db) => {
				let responses = [];
				return db.all(`SELECT guildId, divisionName, members, pickOrder FROM DivisionCatalog WHERE guildId="${id}"`).then((rows: any) => {
					if (rows) {
						responses = rows;
						resolve(responses);
						return rows;
					} else {
						console.log(`Draft data not found on this server!`);
						reject();
					}
				}).catch((err) => {
					reject(err);
				})
			});
		});
	}

	getDivisionData(id: string, divisionId?: string, name?: string) {
		return this.dbInstance().then((db) => {
			return db.get(`SELECT divisionId, divisionName, members, pickOrder FROM DivisionCatalog WHERE guildId="${id}" AND (divisionId="${divisionId}" OR divisionName="${name}")`).then((row: any) => {
				if (row) {
					return row;
				} else {
					console.log(`Division ${name} not found!`);
				}
			}).catch((err) => {
				console.log('ERROR GETTING', err);
			})
		});
	}

	setDivisionData(id: string, divisionId: string, propertyArray: string[], valueArray: string[]) {
		return this.dbInstance().then((db) => {
			if (propertyArray.length === valueArray.length) {
				let increment = 0;
				for (const property of propertyArray) {
					const value = valueArray[increment];
					
					db.run(`INSERT INTO DivisionCatalog (guildId, divisionId, ${property}) 
							VALUES ("${id}", "${divisionId}", "${value}") 
							ON CONFLICT (divisionId) DO UPDATE SET ${property}=excluded.${property}`).then((a) => {
						console.log('Division data updated');
					});

					++increment;
				}
			}
		});
	}

	divisionInfo(message: Discord.Message) {
		const guild = message.guild;

		if (!guild) { return; }

		const [,,divisionName] = message.content.split(' ');

		if (!divisionName) {
			message.channel.send(`Division ${divisionName} is not on the current draft (or server)`);
			return;
		}

		this.getDivisionData(guild.id, null, divisionName).then((rowValue) => {
			if (rowValue) {
				message.channel.send(`
The division **${rowValue.divisionName}** has the following:

- **Members**: ${rowValue.members && rowValue.members.split(',').join(', ') || '_Still empty_'}
- **Draft pick order**: ${rowValue.pickOrder && rowValue.pickOrder.split(',').join('\t\n ->') || '_Still empty_'}

`);
			} else {
				message.channel.send(`No data found for **${divisionName}**`);
			}
		});
	}

	getDraftDivisions(message: Discord.Message) {
		const guild = message.guild;

		if (!guild) { return; }

		this.getAllDivisionsFromGuild(guild.id).then((data: any[]) => {
			if (data) {
				const draftData = [];
				data.forEach(rowValue => {
					draftData.push(`\tDivision **${rowValue.divisionName}**
**===**
	**Members**: ${rowValue.members && rowValue.members.split(',').join(', ') || '_Still empty_'}
	**Draft pick order**:  ${rowValue.pickOrder && '\n\t ->' + rowValue.pickOrder.split(',').join('\n\t -> ') || '_Still empty_'}\n`);
				});

				if (draftData.length === 0) {
					message.channel.send(`
	The current draft for **${guild.name}** has the following divisions: _No divisions yet_
	`);
				} else {
					message.channel.send(`
		The current draft for **${guild.name}** has the following divisions:
		`);

					if (draftData.join('\n').length > 2000) {
						draftData.forEach(division => {
							message.channel.send(division);
						});
					} else {
						message.channel.send(draftData.join('\n'));
					}
				}
			}
		});
	}
}