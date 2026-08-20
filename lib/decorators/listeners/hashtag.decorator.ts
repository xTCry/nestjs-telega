import { ListenerDecorator } from '../../utils';

/**
 * Hashtag handling.
 *
 * @see https://telegraf.js.org/#/?id=hashtag
 */
export const TgHashtag = ListenerDecorator('hashtag');

/** Alias for {@link TgHashtag}. */
export const Hashtag = TgHashtag;
