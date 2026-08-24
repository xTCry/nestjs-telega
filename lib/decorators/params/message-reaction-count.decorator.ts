import { PipeTransform, Type } from '@nestjs/common';

import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafPipesParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает update об агрегированном количестве анонимных реакций.
 *
 * Тип параметра: {@link import('telegraf-hardened/types').MessageReactionCountUpdated}.
 */
export function TgMessageReactionCount(): ParameterDecorator;
export function TgMessageReactionCount(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgMessageReactionCount(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgMessageReactionCount(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createTelegrafPipesParamDecorator(
    TelegrafParamtype.MESSAGE_REACTION_COUNT,
  )(property, ...pipes);
}

/** Alias for {@link TgMessageReactionCount}. */
export const MessageReactionCount = TgMessageReactionCount;
