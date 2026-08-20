import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling callback_data actions with regular expressions.
 *
 * @see https://telegraf.js.org/#/?id=action
 */
export const TgAction = ListenerDecorator('action');

/** Alias for {@link TgAction}. */
export const Action = TgAction;
