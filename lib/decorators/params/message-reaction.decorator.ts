import { PipeTransform, Type } from '@nestjs/common';

import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafPipesParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает update об изменении реакции пользователя.
 *
 * Тип параметра: {@link import('telegraf-hardened/types').MessageReactionUpdated}.
 */
export function TgMessageReaction(): ParameterDecorator;
export function TgMessageReaction(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgMessageReaction(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgMessageReaction(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createTelegrafPipesParamDecorator(TelegrafParamtype.MESSAGE_REACTION)(
    property,
    ...pipes,
  );
}

/** Alias for {@link TgMessageReaction}. */
export const MessageReaction = TgMessageReaction;
