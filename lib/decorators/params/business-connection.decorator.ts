import { PipeTransform, Type } from '@nestjs/common';

import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafPipesParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает connection Telegram Business из текущего update.
 *
 * Тип параметра: {@link import('telegraf-hardened/types').BusinessConnection}.
 */
export function TgBusinessConnection(): ParameterDecorator;
export function TgBusinessConnection(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgBusinessConnection(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgBusinessConnection(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createTelegrafPipesParamDecorator(
    TelegrafParamtype.BUSINESS_CONNECTION,
  )(property, ...pipes);
}

/** Alias for {@link TgBusinessConnection}. */
export const BusinessConnection = TgBusinessConnection;
