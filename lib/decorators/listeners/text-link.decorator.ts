import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling messages with text_link entity.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; совпадение доступно как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=telegraf-textlink
 */
export const TgTextLink = ListenerDecorator('textLink');

/** Alias for {@link TgTextLink}. */
export const TextLink = TgTextLink;
