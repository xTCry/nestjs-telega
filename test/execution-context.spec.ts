import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import type { Context, MiddlewareFn } from 'telegraf';

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
  } as unknown as Context;
  const next: MiddlewareFn<Context> = () => Promise.resolve();

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
      factory.exchangeKeyForValue(TelegrafParamtype.SENDER, 'id', []),
    ).toBeUndefined();
  });
});
