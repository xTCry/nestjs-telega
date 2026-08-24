import { PipeTransform, Type } from '@nestjs/common';

import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafPipesParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает `message` текущего update или его поле.
 *
 * Тип параметра: {@link import('telegraf-hardened/types').Message}. После
 * `@On('sticker')`, `@On('text')` и других фильтров укажите соответствующий
 * narrowed message type из `telegraf-hardened/types` вручную.
 */
export function TgMessage(): ParameterDecorator;
export function TgMessage(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgMessage(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgMessage(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createTelegrafPipesParamDecorator(TelegrafParamtype.MESSAGE)(
    property,
    ...pipes,
  );
}

/** Alias for {@link TgMessage}. */
export const Message = TgMessage;
