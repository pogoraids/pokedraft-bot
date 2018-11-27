export const GREETING = "Bot is alive";

export const EN = {
	GREETING: "Bot is alive",
	HELP: `**PokeDraft-Bot** by @enanox

Commands:

- **create-draft** \`<name>\`: Creates a new \`<name>\` category
- **create-division** \`<catName>\` \`<name>\`: Creates a new \`<name>\` division below the \`<catName>\` category, along with a <name> role.
- **assign-division** \`<division>\` _[users]_: Assigns the [users] list (mentions or username#discriminator list) to the \`<division>\` division under the \`<catName>\` category.
- **game-on** \`<division>\` _[users]_: Tags the \`<division>\` on their channel and posts the pick order.
- **clear-division** \`<division>\`: Deletes the \`<division>\` role (but keeps the channel -for chat purposes-).
- **draft-info**: Lists all the divisions created for the ongoing draft.
- **division-info** \`<division>\`: Lists the \`<division>\` info for the ongoing draft.
- **standings** or **scores**: Retrieves the master sheet / scorecard saved for the current Draft on the server.
`,
	GAME_ON_1: 'Draft starts ',
	GAME_ON_2: 'The order is the following: ',
	GAME_ON_3: 'Make your pick and tag the next person in the order, remember, the last one picks twice and reverts the picking order.\n\nYou can check the division info by mentioning me and the command like this: `@draft-bot division-info yourDivisionName`',
	ERRORS: {
		MISSING_GUILD_CONFIG: 'Missing guild configuration, due to not existing or not having being set.',
		GAME_ON_NOT_ALLOWED: 'You cannot use the command `game-on` here.',
		GAME_ON_EMPTY_DIVISION: 'This division have no members assigned. Please run `assign-division` first.',
		GAME_ON_MISSING_PARAMETERS: 'You must specify the division.',
		DIVISION_NOT_FOUND: '%1 division not found!',
		ROLE_NOT_FOUND: '%1 role not found!',
		DROP_DIVISION_NOT_FOUND: 'Division **%1** is not on the current draft (or server)!',
		DROP_DIVISION_NO_DATA: 'No data found for division **%1**',
		DROP_DIVISION_NOT_ALLOWED: 'You cannot use the command `drop-division` here'
	},
	DROP_DIVISION_ANSWER: 'The division **%1** has been removed from the current Draft.'
};

export const ES = {
	GREETING: "Bot is alive",
	HELP: `**PokeDraft-Bot** por @enanox

Comandos:

- **create-draft** \`<nombre>\`: Crea una nueva categoria de nombre  \`<nombre>\`
- **create-division** \`<nombreCat>\` \`<nombre>\`: Crea una nueva \`<nombre>\` división bajo la categoría \`<nombreCat>\`, junto con un rol \`<nombre>\`.
- **assign-division** \`<division>\` _[usuarios]_: Asigna la lista de [usuarios] (lista de menciones o nombre#discriminador) a la división \`<division>\`.
- **game-on** \`<division>\` _[users]_: Etiqueta a la \`<division>\` en su canal y publica el order de selección.
- **clear-division** \`<division>\`: Elimina el rol \`<division>\` (pero mantiene el canal -por motivos de comunidad-).
- **draft-info**: Detalla todas las divisiones creadas para el draft en curso.
- **division-info** \`<division>\`: Detalla la información de la \`<division>\` para el draft en curso.
- **standings** o **scores**: Muestra la hoja maestra / puntuaciones guardada para el Draft actual en el servidor.
`,
	GAME_ON_1: 'Comienza el Draft ',
	GAME_ON_2: 'El orden es el siguiente: ',
	GAME_ON_3: 'Haz tu elección y etiqueta a la siguiente persona en el orden, recuerda: el último elige dos y revierte el orden de elección.\n\nPuedes consultar la información de la división con una etiqueta y el comando así: `@draft-bot division-info nombreDivision`',
	ERRORS: {
		MISSING_GUILD_CONFIG: 'Falta la configuración del servidor, ya sea porque no existe o no se ha registrado.',
		GAME_ON_NOT_ALLOWED: 'No puedes usar el comando `game-on` aquí.',
		GAME_ON_EMPTY_DIVISION: 'Esta división no tiene miembros asignados. Por favor corra `assign-division` primero.',
		GAME_ON_MISSING_PARAMETERS: 'Debes especificar la división.',
		DIVISION_NOT_FOUND: 'División %1 no encontrada!',
		ROLE_NOT_FOUND: 'Rol %1 no encontrado!',
		DROP_DIVISION_NOT_FOUND: 'La división **%1** no existe en el draft actual (o servidor)!',
		DROP_DIVISION_NO_DATA: 'No hay datos para la división **%1**',
		DROP_DIVISION_NOT_ALLOWED: 'No puedes usar el comando `drop-division` aquí.'
	},
	DROP_DIVISION_ANSWER: 'La división **%1** ha sido removida del Draft en curso.'
}