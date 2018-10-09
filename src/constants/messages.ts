export const GREETING = "Bot is alive";
export const HELP = `PokeDraft-Bot by @enanox

Commands:

- **create-draft** \`<name>\`: Creates a new \`<name>\` category
- **create-division** \`<catName>\` \`<name>\`: Creates a new \`<name>\` division below the \`<catName>\` category, along with a <name> role.
- **assign-division** \`<division>\` _[users]_: Assigns the [users] list (mentions or username#discriminator list) to the \`<division>\` division under the \`<catName>\` category.
- **game-on** \`<division>\` _[users]_: Tags the \`<division>\` on their channel and posts the pick order.
`;

export const GAME_ON_1 = 'Draft starts ';
export const GAME_ON_2 = 'The order is the following: ';
export const GAME_ON_3 = 'Make your pick and tag the next person in the order, remember, the last one picks twice and reverts the picking order.';