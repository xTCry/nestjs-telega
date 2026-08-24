import type { Composer } from 'telegraf-hardened';

import { ListenerDecorator } from '../../utils';

type HearsDecorator = ReturnType<
  typeof ListenerDecorator<Composer<never>, 'hears'>
>;

/**
 * Registers middleware for handling text messages.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; regexp match доступен как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=hears
 */
export const TgHears: HearsDecorator = ListenerDecorator('hears');

/** Alias for {@link TgHears}. */
export { TgHears as Hears };
