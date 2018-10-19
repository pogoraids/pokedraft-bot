export const GREETING = "Bot is alive";
export const HELP = `PokeDraft-Bot by @enanox

Commands:

- **create-draft** \`<name>\`: Creates a new \`<name>\` category
- **create-division** \`<catName>\` \`<name>\`: Creates a new \`<name>\` division below the \`<catName>\` category, along with a <name> role.
- **assign-division** \`<division>\` _[users]_: Assigns the [users] list (mentions or username#discriminator list) to the \`<division>\` division under the \`<catName>\` category.
- **game-on** \`<division>\` _[users]_: Tags the \`<division>\` on their channel and posts the pick order.
- **clear-division** \`<division>\`: Deletes the \`<division>\` role (but keeps the channel -for chat purposes-).
`;

export const GAME_ON_1 = 'Draft starts ';
export const GAME_ON_2 = 'The order is the following: ';
export const GAME_ON_3 = 'Make your pick and tag the next person in the order, remember, the last one picks twice and reverts the picking order.';

export const EN = {
	GREETING: "Bot is alive",
	HELP: `PokeDraft-Bot by @enanox

Commands:

- **create-draft** \`<name>\`: Creates a new \`<name>\` category
- **create-division** \`<catName>\` \`<name>\`: Creates a new \`<name>\` division below the \`<catName>\` category, along with a <name> role.
- **assign-division** \`<division>\` _[users]_: Assigns the [users] list (mentions or username#discriminator list) to the \`<division>\` division under the \`<catName>\` category.
- **game-on** \`<division>\` _[users]_: Tags the \`<division>\` on their channel and posts the pick order.
- **clear-division** \`<division>\`: Deletes the \`<division>\` role (but keeps the channel -for chat purposes-).
`,
	GAME_ON_1: 'Draft starts ',
	GAME_ON_2: 'The order is the following: ',
	GAME_ON_3: 'Make your pick and tag the next person in the order, remember, the last one picks twice and reverts the picking order.'
};

export const ES = {
	GREETING: "Bot is alive",
	HELP: `PokeDraft-Bot por @enanox

Comandos:

- **create-draft** \`<nombre>\`: Crea una nueva categoria de nombre  \`<nombre>\`
- **create-division** \`<nombreCat>\` \`<nombre>\`: Crea una nueva \`<nombre>\` división bajo la categoría \`<nombreCat>\`, junto con un rol \`<nombre>\`.
- **assign-division** \`<division>\` _[usuarios]_: Asigna la lista de [usuarios] (lista de menciones o nombre#discriminador) a la división \`<division>\`.
- **game-on** \`<division>\` _[users]_: Etiqueta a la \`<division>\` en su canal y publica el order de selección.
- **clear-division** \`<division>\`: Elimina el rol \`<division>\` (pero mantiene el canal -por motivos de comunidad-).
`,
	GAME_ON_1: 'Comienza el Draft ',
	GAME_ON_2: 'El orden es el siguiente: ',
	GAME_ON_3: 'Haz tu elección y etiqueta a la siguiente persona en el orden, recuerda: el último elige dos y revierte el orden de elección.'
}