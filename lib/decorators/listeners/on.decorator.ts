import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for provided update type.
 *
 * Тип `@Ctx()` параметра зависит от переданного filter query. Используйте
 * `NarrowedContext<Context, Update.*Update>` из `telegraf-hardened` либо
 * собственный расширенный context.
 *
 * @see https://telegraf.js.org/#/?id=on
 */
export const TgOn = ListenerDecorator('on');

/** Alias for {@link TgOn}. */
export const On = TgOn;
