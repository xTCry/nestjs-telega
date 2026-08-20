import { ListenerDecorator } from '../../utils';

/**
 * Registers middleware for handling inline_query actions with regular expressions.
 *
 * @see https://telegraf.js.org/#/?id=inlinequery
 */
export const TgInlineQuery = ListenerDecorator('inlineQuery');

/** Alias for {@link TgInlineQuery}. */
export const InlineQuery = TgInlineQuery;
