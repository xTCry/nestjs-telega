import { ListenerDecorator } from '../../utils';

/**
 * Cashtag handling.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; совпадение доступно как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=cashtag
 */
export const TgCashtag = ListenerDecorator('cashtag');

/** Alias for {@link TgCashtag}. */
export const Cashtag = TgCashtag;
