import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for provided update type.
 *
 * @see https://telegraf.js.org/#/?id=on
 */
export const TgOn = ListenerDecorator('on');

/** Alias for {@link TgOn}. */
export const On = TgOn;
