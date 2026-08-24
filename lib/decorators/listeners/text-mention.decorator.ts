import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling messages with text_mention entity.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; совпадение доступно как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=telegraf-textlink
 */
export const TgTextMention = ListenerDecorator('textMention');

/** Alias for {@link TgTextMention}. */
export const TextMention = TgTextMention;
