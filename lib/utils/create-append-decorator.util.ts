import { Reflector } from '@nestjs/core';

import type { CustomDecorator } from '../decorators/append-metadata.decorator';
import { appendMetadata } from '../decorators/append-metadata.decorator';

export interface CreateAppendDecoratorOptions<TValue, TResult = TValue> {
  /** Если ключ не задан, NestJS генерирует уникальный metadata key. */
  key?: string;
  transform?: (value: TValue) => TResult;
}

export type AppendableDecorator<TValue, TResult = TValue> = ((
  value: TValue,
) => CustomDecorator) & {
  KEY: string;
  readonly __metadata?: TResult;
};

/** Создаёт decorator factory с metadata, накапливаемой на одном методе. */
export function createAppendDecorator<TValue, TResult = TValue>(
  options: CreateAppendDecoratorOptions<TValue, TResult> = {},
): AppendableDecorator<TValue, TResult> {
  const metadataKey = options.key ?? Reflector.createDecorator<TResult>().KEY;
  const decorator = ((value: TValue): CustomDecorator => {
    const metadataValue = options.transform
      ? options.transform(value)
      : (value as unknown as TResult);

    return appendMetadata(metadataKey, metadataValue);
  }) as AppendableDecorator<TValue, TResult>;

  decorator.KEY = metadataKey;
  return decorator;
}
