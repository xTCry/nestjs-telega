import { ListenerDecorator } from '../../utils';

/**
 * Phone number handling.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; совпадение доступно как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=phone
 */
export const TgPhone = ListenerDecorator('phone');

/** Alias for {@link TgPhone}. */
export const Phone = TgPhone;
