import { Reflector } from '@nestjs/core';

import type { TelegrafReplyExtra } from '../../interfaces';

/** Устанавливает дополнительные параметры reply для класса или метода listener-а. */
export const TgReplyOptions = Reflector.createDecorator<TelegrafReplyExtra>();

/** Обратносуместимое имя {@link TgReplyOptions}. */
export const TelegrafReplyOptions = TgReplyOptions;

/** Alias for {@link TgReplyOptions}. */
export const ReplyOptions = TgReplyOptions;
