import { ListenerDecorator } from '../../utils';

/**
 * Registers a middleware.
 *
 * Типы параметров: {@link import('telegraf-hardened').Context} и
 * {@link import('telegraf-hardened').MiddlewareFn} для `@Ctx()` и `@Next()`.
 *
 * @see https://telegraf.js.org/#/?id=use
 */
export const TgUse = ListenerDecorator('use');

/** Alias for {@link TgUse}. */
export const Use = TgUse;
