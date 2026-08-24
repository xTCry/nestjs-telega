import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling callback_data actions with game query.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.CallbackQueryUpdate>`
 * из `telegraf-hardened`.
 *
 * @see https://telegraf.js.org/#/?id=inlinequery
 */
export const TgGameQuery = ListenerDecorator('gameQuery');

/** Alias for {@link TgGameQuery}. */
export const GameQuery = TgGameQuery;
