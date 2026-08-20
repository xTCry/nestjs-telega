import { ListenerDecorator } from '../../utils';

/**
 * Handler for /start command.
 *
 * @see https://telegraf.js.org/#/?id=start
 */
export const TgStart = ListenerDecorator('start');

/** Alias for {@link TgStart}. */
export const Start = TgStart;
