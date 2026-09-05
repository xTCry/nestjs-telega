import { ParamData } from '@nestjs/common';
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator';
import type { Context } from 'telegraf-hardened';

import { TelegrafParamtype } from '../enums/telegraf-paramtype.enum';

export class TelegrafParamsFactory implements ParamsFactory {
  exchangeKeyForValue(
    type: TelegrafParamtype,
    data: ParamData,
    args: unknown[],
  ): unknown {
    const [ctx, next] = args as [
      Context | undefined,
      (() => Promise<void>) | undefined,
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
      case TelegrafParamtype.BUSINESS_CONNECTION:
        return getContextProperty(ctx?.businessConnection, data);
      case TelegrafParamtype.BUSINESS_MESSAGE:
        return getContextProperty(ctx?.businessMessage, data);
      case TelegrafParamtype.EDITED_BUSINESS_MESSAGE:
        return getContextProperty(ctx?.editedBusinessMessage, data);
      case TelegrafParamtype.DELETED_BUSINESS_MESSAGES:
        return getContextProperty(ctx?.deletedBusinessMessages, data);
      case TelegrafParamtype.MESSAGE_REACTION:
        return getContextProperty(ctx?.messageReaction, data);
      case TelegrafParamtype.MESSAGE_REACTION_COUNT:
        return getContextProperty(ctx?.messageReactionCount, data);
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
