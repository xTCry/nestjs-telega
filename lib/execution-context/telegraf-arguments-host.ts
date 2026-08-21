import { ArgumentsHost } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import type { Context, MiddlewareFn } from 'telegraf-hardened';

import { TelegrafContextType } from './telegraf-execution-context';

export class TelegrafArgumentsHost extends ExecutionContextHost {
  public static create(context: ArgumentsHost): TelegrafArgumentsHost {
    const type = context.getType();
    const tgContext = new TelegrafArgumentsHost(context.getArgs());
    tgContext.setType(type);
    return tgContext;
  }

  public getType<TContext extends string = TelegrafContextType>(): TContext {
    return super.getType();
  }

  public getContext<T = Context>(): T {
    return this.getArgByIndex(0);
  }

  public getNext<T = MiddlewareFn<Context>>(): T {
    return this.getArgByIndex(1);
  }
}
