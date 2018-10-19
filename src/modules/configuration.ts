import * as sql from 'sqlite';
import * as Discord from 'discord.js';
import { CREATE_GUILD } from '../constants/dbCatalogs';
import { resolve, dirname } from 'path';

export class Configuration {
	constructor(private db?: sql.Database) {}

	dbInstance(): Promise<sql.Database> {		
		return sql.open(resolve(dirname('.') + '/pokedraft.sqlite')).then((db: sql.Database) => {
			return db;
		});
	}

	createGuildCatalog() {
		return this.db.run(CREATE_GUILD).then(() => {
			console.log('table created');
		}).catch((err) => {
			console.log('CRITICAL ERROR', err);
		});
	}

	registerGuild(id: string, name: string) {
		this.db.run('INSERT INTO GuildCatalog(guildId, guildName, adminChannel, rolesAllowed, language) VALUES (?, ?, ?, ?, ?)', [id, name, 'draftbot-admin', '', 'en']).then(() => {
			console.log(name + ' guild registered');
		});
	}

	getGuildData(id: string, name: string) {
		return this.dbInstance().then((db) => {
			return db.get(`SELECT guildName, adminChannel, rolesAllowed, language FROM GuildCatalog WHERE guildId="${id}"`).then((row: any) => {
				if (row) {
					return row;
				} else {
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
			message.channel.send(`
This server ${rowValue.guildName} has the following configurations:

- Admin channel: ${rowValue.adminChannel}
- Language: ${rowValue.language}
- Roles allowed to use the bot: ${rowValue.rolesAllowed}

Set any configuration using \`set-config\` \`config\` \`newValue\`.
`);
		});
	}

	setConfigData(message: Discord.Message, text: string) {
		const guild = message.guild;

		if (!guild) { return; }
		const [property, value, rest] = text.split(" ");

		this.setGuildData(guild.id, property, value).then((rowValue) => {
			message.channel.send(`This server ${guild.name} updated ${property} to ${value}`);
		});
	}

	getLanguage(guildId: string) {
		return this.dbInstance().then((db) => {
			return db.get(`SELECT language FROM GuildCatalog WHERE guildId = "${guildId}"`).then((row) => {
				console.log(row);
				return row.language;
			});
		});
	}
}