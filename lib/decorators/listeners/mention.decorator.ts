import { ListenerDecorator } from '../../utils';

/**
 * Mention handling.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; совпадение доступно как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=mention
 */
export const TgMention = ListenerDecorator('mention');

/** Alias for {@link TgMention}. */
export const Mention = TgMention;
