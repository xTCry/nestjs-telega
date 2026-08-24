import { ListenerDecorator } from '../../utils';

/**
 * Handler for /settings command.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`.
 *
 * @see https://telegraf.js.org/#/?id=settings
 */
export const TgSettings = ListenerDecorator('settings');

/** Alias for {@link TgSettings}. */
export const Settings = TgSettings;
