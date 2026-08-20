import { ListenerDecorator } from '../../utils';

/**
 * Mention handling.
 *
 * @see https://telegraf.js.org/#/?id=mention
 */
export const TgMention = ListenerDecorator('mention');

/** Alias for {@link TgMention}. */
export const Mention = TgMention;
