import { PipeTransform, Type } from '@nestjs/common';

import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafPipesParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает сведения об удалённых сообщениях Telegram Business account.
 *
 * Тип параметра: {@link import('telegraf-hardened/types').BusinessMessagesDeleted}.
 */
export function TgDeletedBusinessMessages(): ParameterDecorator;
export function TgDeletedBusinessMessages(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgDeletedBusinessMessages(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgDeletedBusinessMessages(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createTelegrafPipesParamDecorator(
    TelegrafParamtype.DELETED_BUSINESS_MESSAGES,
  )(property, ...pipes);
}

/** Alias for {@link TgDeletedBusinessMessages}. */
export const DeletedBusinessMessages = TgDeletedBusinessMessages;
