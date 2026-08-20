import { Reflector } from '@nestjs/core';

import type { TelegrafReplyExtra } from '../../interfaces';

/** Устанавливает дополнительные параметры reply для класса или метода listener-а. */
export const TelegrafReplyOptions =
  Reflector.createDecorator<TelegrafReplyExtra>();

/** Alias, который сохраняет лаконичный стиль декораторов пакета. */
export const ReplyOptions = TelegrafReplyOptions;
