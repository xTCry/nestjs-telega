import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling text messages.
 *
 * @see https://telegraf.js.org/#/?id=hears
 */
export const TgHears = ListenerDecorator('hears');

/** Alias for {@link TgHears}. */
export const Hears = TgHears;
