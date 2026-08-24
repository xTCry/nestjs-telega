import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling messages with email entity.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; совпадение доступно как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=telegraf-email
 */
export const TgEmail = ListenerDecorator('email');

/** Alias for {@link TgEmail}. */
export const Email = TgEmail;
