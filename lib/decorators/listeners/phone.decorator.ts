import { ListenerDecorator } from '../../utils';

/**
 * Phone number handling.
 *
 * @see https://telegraf.js.org/#/?id=phone
 */
export const TgPhone = ListenerDecorator('phone');

/** Alias for {@link TgPhone}. */
export const Phone = TgPhone;
