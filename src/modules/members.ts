import { Message, RichEmbed } from 'discord.js';
import { BackendService } from "../utils/backend";
import { mechanicFormatsImgUrl, embedFooter } from '../constants/app';
import * as moment from 'moment';

export class Members {
    footer: { text: string, icon: string } = embedFooter;

    async getTourneyInfo(message: Message) {
        const api = new BackendService();

        const tournament = await api.getTournament(message);

        if (!tournament) {
            message.channel.send("Tournament data not found");
            return;
        }

        const infoEmbed = new RichEmbed();
        infoEmbed.setAuthor(message.guild.name, message.guild.iconURL);
        infoEmbed.setTitle(tournament.name);
        infoEmbed.setFooter(this.footer.text, this.footer.icon);
        const createdDate = moment(tournament.createdAt);
       
        infoEmbed.setDescription(`This tournament was created on ${createdDate.format('MM-DD-YYYY HH:MM')}`);
        infoEmbed.addField("Mechanic", tournament.mechanic || 'Not set.');

        if (tournament.pods) {
            infoEmbed.addField('Pods', 'Here are the pods / divisions registered so far:');

            const mappedByFormat = {};
            tournament.pods.forEach(pod => {
                if (!mappedByFormat[pod.mechanicFormat]) {
                    mappedByFormat[pod.mechanicFormat] = [];
                }

                mappedByFormat[pod.mechanicFormat].push(pod);
            });

            for (const format of Object.keys(mappedByFormat)) {
                if (format && mappedByFormat[format]) {
                    infoEmbed.addField(`**${format.charAt(0).toUpperCase()+format.substr(1)}**`, mappedByFormat[format].map(p => `<#${p.id}>`).join("\n"), true);
                }
            }
        } else {
            infoEmbed.addField('Pods', 'No pods have been registered yet.')
        }

        if (tournament.banlist) {
            infoEmbed.addField('Banlist', 'You can check the current banlist on <https://pogoraids.github.io/web/banlist' + tournament.banlistId + '>.')
        } else {
            infoEmbed.addField('Banlist', 'No restrictions applied yet.');
        }

        if (tournament.members && tournament.members.length > 0) {
            infoEmbed.addField('Registered members', 'Here are the members registered so far:');
        } else {
            infoEmbed.addField('Registered members', 'No players registered yet.');
        }

        message.channel.send(infoEmbed);
        return;
    }

    async getPodInfo(message: Message, options?: { onlyPicks: boolean }) {
        const api = new BackendService();
        const pod = await api.getPod(message);
        // const pod = {
        //     tournamentId: '123456789123456',
        //     id: message.channel.id,
        //     name: 'GL-Counter',
        //     mechanic: 'PvP',
        //     mechanicFormat: 'Great',
        //     members: [
        //         { displayName: 'Dutchgoku' }, { displayName: 'enanox' }, { displayName: 'DrrDave' }, { displayName: 'vlfph' }, { displayName: 'Varun (PokeTrnrSpark)' }
        //     ],
        //     pickingOrder: [
        //         { displayName: 'Dutchgoku' }, { displayName: 'enanox' }, { displayName: 'DrrDave' }, { displayName: 'vlfph' }, { displayName: 'Varun (PokeTrnrSpark)' }
        //     ],
        //     picks: [
        //         { displayName: 'Dutchgoku', species: 'Togekiss' }, { displayName: 'enanox', species: 'Swampert' }, { displayName: 'DrrDave', species: 'Giratina-A' },
        //         { displayName: 'vlfph', species: 'Dialga' }, { displayName: 'Varun (PokeTrnrSpark)', species: 'Giratina-O' },
        //         { displayName: 'Varun (PokeTrnrSpark)', species: 'Lugia' }, { displayName: 'vlfph', species: 'Lucario' },
        //     ]
        // };

        if (!pod) {
            message.channel.send('Pod / division not found');
            return;
        }

        const infoEmbed = new RichEmbed();
        infoEmbed.setAuthor(message.guild.name, message.guild.iconURL);
        infoEmbed.setTitle(`**${pod.name}**`);
        infoEmbed.setFooter(this.footer.text, this.footer.icon);

        const mechanicImg = mechanicFormatsImgUrl;

        infoEmbed.setThumbnail(mechanicImg[(pod.mechanicFormat && pod.mechanicFormat.toLowerCase()) || (pod.mechanic && pod.mechanic.toLowerCase())]);
        infoEmbed.setDescription(`You can always check this pod thorough details on https://pogoraids.github.io/web/tournament/${pod.tournamentId}/pod/${pod.id}`);

        if (!options || !options.onlyPicks) {
            if (pod.members && pod.members.length > 0) {
                const memberList = pod.members.map(m => m.displayName);

                infoEmbed.addField('**Members**', memberList.join(', '));
            } else {
                infoEmbed.addField('**Members**', 'No players assigned yet!');
            }

            if (pod.pickingOrder && pod.pickingOrder.length > 0) {
                const ordered = pod.pickingOrder.map(m => m.displayName);
                let formatted = '';
                ordered.forEach((p, i) => {
                    formatted += `**${i + 1}** - **${p}**` + '\n';
                });
                infoEmbed.addField('**Draft order**', formatted);
            } else {
                infoEmbed.addField('**Draft order**', 'Picking order still have not been defined!');
            }
        }

        if (pod.picks && pod.picks.length > 0) {
            if (!options || !options.onlyPicks) {
                infoEmbed.addField('**Picks**', 'Below are listed each players\' picks so far: ');
            }

            const byEachPlayer = {};
            pod.picks.forEach(p => {
                if (!byEachPlayer[p.displayName]) {
                    byEachPlayer[p.displayName] = [];
                }

                byEachPlayer[p.displayName].push(p.species);
            });

            for (const p of Object.keys(byEachPlayer)) {
                infoEmbed.addField(p, byEachPlayer[p].join(', '));
            }
        } else {
            infoEmbed.addField('**Picks**', 'No picks have been made yet!');
        }

        message.channel.send(infoEmbed);
        return;
    }
}