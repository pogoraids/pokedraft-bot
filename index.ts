import * as Discord from 'discord.js';
import * as sql from 'sqlite';
import { readFileSync } from 'fs';
import { GREETING } from './src/constants/messages';
import { Listener } from './src/modules/listener';
import { Channels } from './src/modules/channels';
import { Configuration } from './src/modules/configuration';

export class Index {
	constructor() {
		const client = new Discord.Client();
		const TOKEN = readFileSync('./src/config/token');
		let db = null;

		client.on('ready', () => {
			console.log(GREETING);
			
			sql.open('./pokedraft.sqlite').then((database: sql.Database) => {
				db = database;
				new Channels().createBotChannel(client, db);
				// console.log(db);
				// console.log('database created');
				//new Configuration(db).createGuildCatalog();
			})
		});

		client.on('message', new Listener().parse);

		client.login(TOKEN.toString());
	}
}

new Index();