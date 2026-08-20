import { ListenerDecorator } from '../../utils';

/**
 * Registers a middleware.
 *
 * @see https://telegraf.js.org/#/?id=use
 */
export const TgUse = ListenerDecorator('use');

/** Alias for {@link TgUse}. */
export const Use = TgUse;
