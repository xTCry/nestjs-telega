import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling callback_data actions with game query.
 *
 * @see https://telegraf.js.org/#/?id=inlinequery
 */
export const GameQuery = ListenerDecorator('gameQuery');
