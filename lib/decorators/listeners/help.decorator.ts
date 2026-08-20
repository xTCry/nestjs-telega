import { ListenerDecorator } from '../../utils';

/**
 * Handler for /help command.
 *
 * @see https://telegraf.js.org/#/?id=help
 */
export const TgHelp = ListenerDecorator('help');

/** Alias for {@link TgHelp}. */
export const Help = TgHelp;
