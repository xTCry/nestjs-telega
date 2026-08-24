import type { Composer } from 'telegraf-hardened';

import { ListenerDecorator } from '../../utils';

type CommandDecorator = ReturnType<
  typeof ListenerDecorator<Composer<never>, 'command'>
>;

/**
 * Command handling.
 *
 * Тип `@Ctx()` параметра: `NarrowedContext<Context, Update.MessageUpdate>`
 * из `telegraf-hardened`; аргументы команды доступны как `ctx.match`.
 *
 * @see https://telegraf.js.org/#/?id=command
 */
export const TgCommand: CommandDecorator = ListenerDecorator('command');

/** Alias for {@link TgCommand}. */
export { TgCommand as Command };
