import * as Discord from 'discord.js';
import { readFileSync } from 'fs';
import { GREETING } from './src/constants/messages';
import { Listener } from './src/modules/listener';
import { Channels } from './src/modules/channels';

export class Index {
	constructor() {
		const client = new Discord.Client();
		const TOKEN = readFileSync('./src/config/token');

		client.on('ready', () => {
			console.log(GREETING);
			new Channels().createBotChannel(client);
		});

		client.on('message', new Listener(client).parse);

		client.login(TOKEN.toString());
	}
}

new Index();