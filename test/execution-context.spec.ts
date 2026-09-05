import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import type { Context } from 'telegraf-hardened';

import { TelegrafParamtype } from '../lib/enums/telegraf-paramtype.enum';
import {
  TelegrafArgumentsHost,
  TelegrafExecutionContext,
} from '../lib/execution-context';
import { TelegrafParamsFactory } from '../lib/factories/telegraf-params-factory';

describe('Telegraf execution context', () => {
  const context = {
    from: { id: 1, first_name: 'Test', is_bot: false },
    message: { message_id: 1, text: 'Hello' },
    businessConnection: { id: 'connection-1', is_enabled: true },
    businessMessage: { message_id: 2, text: 'Business hello' },
    editedBusinessMessage: { message_id: 3, text: 'Edited business hello' },
    deletedBusinessMessages: {
      business_connection_id: 'connection-1',
      message_ids: [4, 5],
    },
    messageReaction: { message_id: 6, new_reaction: ['👍'] },
    messageReactionCount: { message_id: 7, reactions: [] },
  } as unknown as Context;
  const next = (): Promise<void> => Promise.resolve();

  it('preserves context, next middleware and custom context type', () => {
    const host = new ExecutionContextHost([context, next]);
    host.setType('telegraf');

    const argumentsHost = TelegrafArgumentsHost.create(host);
    const executionContext = TelegrafExecutionContext.create(host);

    expect(argumentsHost.getType()).toBe('telegraf');
    expect(argumentsHost.getContext()).toBe(context);
    expect(argumentsHost.getNext()).toBe(next);
    expect(executionContext.getType()).toBe('telegraf');
    expect(executionContext.getContext()).toBe(context);
    expect(executionContext.getNext()).toBe(next);
  });

  it('extracts typed parameter values without throwing for missing context', () => {
    const factory = new TelegrafParamsFactory();

    expect(
      factory.exchangeKeyForValue(TelegrafParamtype.CONTEXT, '', [
        context,
        next,
      ]),
    ).toBe(context);
    expect(
      factory.exchangeKeyForValue(TelegrafParamtype.NEXT, '', [context, next]),
    ).toBe(next);
    expect(
      factory.exchangeKeyForValue(TelegrafParamtype.SENDER, 'id', [
        context,
        next,
      ]),
    ).toBe(1);
    expect(
      factory.exchangeKeyForValue(TelegrafParamtype.MESSAGE, 'text', [
        context,
        next,
      ]),
    ).toBe('Hello');
    expect(
      factory.exchangeKeyForValue(TelegrafParamtype.BUSINESS_CONNECTION, 'id', [
        context,
        next,
      ]),
    ).toBe('connection-1');
    expect(
      factory.exchangeKeyForValue(TelegrafParamtype.BUSINESS_MESSAGE, 'text', [
        context,
        next,
      ]),
    ).toBe('Business hello');
    expect(
      factory.exchangeKeyForValue(
        TelegrafParamtype.EDITED_BUSINESS_MESSAGE,
        'text',
        [context, next],
      ),
    ).toBe('Edited business hello');
    expect(
      factory.exchangeKeyForValue(
        TelegrafParamtype.DELETED_BUSINESS_MESSAGES,
        'message_ids',
        [context, next],
      ),
    ).toEqual([4, 5]);
    expect(
      factory.exchangeKeyForValue(
        TelegrafParamtype.MESSAGE_REACTION,
        'message_id',
        [context, next],
      ),
    ).toBe(6);
    expect(
      factory.exchangeKeyForValue(
        TelegrafParamtype.MESSAGE_REACTION_COUNT,
        'message_id',
        [context, next],
      ),
    ).toBe(7);
    expect(
      factory.exchangeKeyForValue(TelegrafParamtype.SENDER, 'id', []),
    ).toBeUndefined();
  });
});
