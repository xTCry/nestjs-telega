import { ListenerDecorator } from '../../utils';

/**
 * Handler for /start command.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; payload доступен как `ctx.payload`.
 *
 * @see https://telegraf.js.org/#/?id=start
 */
export const TgStart = ListenerDecorator('start');

/** Alias for {@link TgStart}. */
export const Start = TgStart;
