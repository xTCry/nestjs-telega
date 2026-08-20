import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling messages with email entity.
 *
 * @see https://telegraf.js.org/#/?id=telegraf-email
 */
export const TgEmail = ListenerDecorator('email');

/** Alias for {@link TgEmail}. */
export const Email = TgEmail;
