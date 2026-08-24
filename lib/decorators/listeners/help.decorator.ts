import { ListenerDecorator } from '../../utils';

/**
 * Handler for /help command.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`.
 *
 * @see https://telegraf.js.org/#/?id=help
 */
export const TgHelp = ListenerDecorator('help');

/** Alias for {@link TgHelp}. */
export const Help = TgHelp;
