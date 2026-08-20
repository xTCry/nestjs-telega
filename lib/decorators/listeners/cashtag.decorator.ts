import { ListenerDecorator } from '../../utils';

/**
 * Cashtag handling.
 *
 * @see https://telegraf.js.org/#/?id=cashtag
 */
export const TgCashtag = ListenerDecorator('cashtag');

/** Alias for {@link TgCashtag}. */
export const Cashtag = TgCashtag;
