import { ListenerDecorator } from '../../utils';

/**
 * Handler for /settings command.
 *
 * @see https://telegraf.js.org/#/?id=settings
 */
export const TgSettings = ListenerDecorator('settings');

/** Alias for {@link TgSettings}. */
export const Settings = TgSettings;
