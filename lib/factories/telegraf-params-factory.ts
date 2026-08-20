import { ParamData } from '@nestjs/common';
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator';
import type { Context, MiddlewareFn } from 'telegraf';

import { TelegrafParamtype } from '../enums/telegraf-paramtype.enum';

export class TelegrafParamsFactory implements ParamsFactory {
  exchangeKeyForValue(
    type: TelegrafParamtype,
    data: ParamData,
    args: unknown[],
  ): unknown {
    const [ctx, next] = args as [
      Context | undefined,
      MiddlewareFn<Context> | undefined,
    ];

    switch (type) {
      case TelegrafParamtype.CONTEXT:
        return ctx;
      case TelegrafParamtype.NEXT:
        return next;
      case TelegrafParamtype.SENDER:
        return getContextProperty(ctx?.from, data);
      case TelegrafParamtype.MESSAGE:
        return getContextProperty(ctx?.message, data);
      default:
        return null;
    }
  }
}

/** Возвращает поле Telegram-сущности, если decorator получил строковый ключ. */
function getContextProperty(value: unknown, data: ParamData): unknown {
  if (typeof data !== 'string' || !value || typeof value !== 'object') {
    return value;
  }

  return (value as Record<string, unknown>)[data];
}
