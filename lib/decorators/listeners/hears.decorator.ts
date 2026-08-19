import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling text messages.
 *
 * @see https://telegraf.js.org/#/?id=hears
 */
export const Hears = ListenerDecorator('hears');
