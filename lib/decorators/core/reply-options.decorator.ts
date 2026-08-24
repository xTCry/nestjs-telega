import { Reflector } from '@nestjs/core';

import type { TelegrafReplyExtra } from '../../interfaces';

/**
 * Устанавливает дополнительные параметры reply для класса или метода listener-а.
 *
 * Тип аргумента: {@link import('telegraf-hardened').Types.ExtraReplyMessage}.
 */
export const TgReplyOptions: ReturnType<
  typeof Reflector.createDecorator<TelegrafReplyExtra>
> = Reflector.createDecorator<TelegrafReplyExtra>();

/** Обратносуместимое имя {@link TgReplyOptions}. */
export { TgReplyOptions as TelegrafReplyOptions };

/** Alias for {@link TgReplyOptions}. */
export { TgReplyOptions as ReplyOptions };
