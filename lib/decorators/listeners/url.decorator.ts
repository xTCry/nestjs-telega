import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling messages with url entity.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; совпадение доступно как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=telegraf-url
 */
export const TgUrl = ListenerDecorator('url');

/** Alias for {@link TgUrl}. */
export const Url = TgUrl;
