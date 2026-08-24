import type { Composer } from 'telegraf-hardened';

import { ListenerDecorator } from '../../utils';

type ActionDecorator = ReturnType<
  typeof ListenerDecorator<Composer<never>, 'action'>
>;

/**
 * Registers middleware for handling callback_data actions with regular expressions.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.CallbackQueryUpdate>`
 * из `telegraf-hardened`; regexp match доступен как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=action
 */
export const TgAction: ActionDecorator = ListenerDecorator('action');

/** Alias for {@link TgAction}. */
export { TgAction as Action };
