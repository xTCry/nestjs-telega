import { PipeTransform, Type } from '@nestjs/common';

import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafPipesParamDecorator } from '../../utils/param-decorator.util';

export function TgSender(): ParameterDecorator;
export function TgSender(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgSender(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function TgSender(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createTelegrafPipesParamDecorator(TelegrafParamtype.SENDER)(
    property,
    ...pipes,
  );
}

/** Alias for {@link TgSender}. */
export const Sender = TgSender;
