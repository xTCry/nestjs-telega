import { ListenerDecorator } from '../../utils';

/**
 * Hashtag handling.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; совпадение доступно как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=hashtag
 */
export const TgHashtag = ListenerDecorator('hashtag');

/** Alias for {@link TgHashtag}. */
export const Hashtag = TgHashtag;
