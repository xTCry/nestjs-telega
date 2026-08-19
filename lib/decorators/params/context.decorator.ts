import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafParamDecorator } from '../../utils/param-decorator.util';

export const Context: () => ParameterDecorator = createTelegrafParamDecorator(
  TelegrafParamtype.CONTEXT,
);

export const Ctx = Context;
