import type { Composer } from 'telegraf-hardened';

import { ListenerDecorator } from '../../utils';

type InlineQueryDecorator = ReturnType<
  typeof ListenerDecorator<Composer<never>, 'inlineQuery'>
>;

/**
 * Registers middleware for handling inline_query actions with regular expressions.
 *
 * @see https://telegraf.js.org/#/?id=inlinequery
 */
export const TgInlineQuery: InlineQueryDecorator =
  ListenerDecorator('inlineQuery');

/** Alias for {@link TgInlineQuery}. */
export { TgInlineQuery as InlineQuery };
