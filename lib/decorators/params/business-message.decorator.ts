import { PipeTransform, Type } from '@nestjs/common';

import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafPipesParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает новое сообщение подключённого Telegram Business account.
 *
 * Тип параметра: `Update.BusinessMessageUpdate['business_message']` из
 * `telegraf-hardened/types`.
 */
export function TgBusinessMessage(): ParameterDecorator;
export function TgBusinessMessage(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgBusinessMessage(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgBusinessMessage(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createTelegrafPipesParamDecorator(TelegrafParamtype.BUSINESS_MESSAGE)(
    property,
    ...pipes,
  );
}

/** Alias for {@link TgBusinessMessage}. */
export const BusinessMessage = TgBusinessMessage;
