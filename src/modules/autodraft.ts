import * as Discord from 'discord.js';
import { BackendService } from '../utils/backend';

export class Autodraft {
    static async response(message: Discord.Message) {
        let api = new BackendService();
        let [data] = await api.getSettingsWithBanlist(message.channel.id);
        
        if (data) {
            let banlist  = await api.getFullBanlist(Number.parseInt(data.banlistId), data.id);
            let [filtered] = banlist.filter(b => b.species.toLowerCase() === message.content.toLowerCase().trim());
            
            // experimental
            if (filtered && filtered.allowed) {            
                message.channel.send('Pick registered');
                message.react("👍");
            }  else if (filtered && !filtered.allowed) {
                message.react("👎");
            }
            // return message.channel.send(banlist.map(b => b.species).join("\n"));
        }
    }
}