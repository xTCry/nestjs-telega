import type { Composer } from 'telegraf-hardened';

import { ListenerDecorator } from '../../utils';

type CommandDecorator = ReturnType<
  typeof ListenerDecorator<Composer<never>, 'command'>
>;

/**
 * Command handling.
 *
 * @see https://telegraf.js.org/#/?id=command
 */
export const TgCommand: CommandDecorator = ListenerDecorator('command');

/** Alias for {@link TgCommand}. */
export { TgCommand as Command };
