import { ListenerDecorator } from '../../utils';

/**
 * Command handling.
 *
 * @see https://telegraf.js.org/#/?id=command
 */
export const TgCommand = ListenerDecorator('command');

/** Alias for {@link TgCommand}. */
export const Command = TgCommand;
