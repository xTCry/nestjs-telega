import { PipeTransform, Type } from '@nestjs/common';

import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafPipesParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает изменённое сообщение подключённого Telegram Business account.
 *
 * Тип параметра: `Update.EditedBusinessMessageUpdate['edited_business_message']`
 * из `telegraf-hardened/types`.
 */
export function TgEditedBusinessMessage(): ParameterDecorator;
export function TgEditedBusinessMessage(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgEditedBusinessMessage(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgEditedBusinessMessage(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createTelegrafPipesParamDecorator(
    TelegrafParamtype.EDITED_BUSINESS_MESSAGE,
  )(property, ...pipes);
}

/** Alias for {@link TgEditedBusinessMessage}. */
export const EditedBusinessMessage = TgEditedBusinessMessage;
