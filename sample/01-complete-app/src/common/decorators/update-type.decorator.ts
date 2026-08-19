import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telega';

export const UpdateType = createParamDecorator(
  (_, ctx: ExecutionContext) =>
    TelegrafExecutionContext.create(ctx).getContext().updateType,
);
