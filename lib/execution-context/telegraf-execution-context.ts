import { ContextType, ExecutionContext } from '@nestjs/common';

import { TelegrafArgumentsHost } from './telegraf-arguments-host';

export type TelegrafContextType = 'telegraf' | ContextType;

export class TelegrafExecutionContext extends TelegrafArgumentsHost {
  public static create(context: ExecutionContext): TelegrafExecutionContext {
    const type = context.getType();
    const tgContext = new TelegrafExecutionContext(
      context.getArgs(),
      context.getClass(),
      context.getHandler(),
    );
    tgContext.setType(type);
    return tgContext;
  }
}
