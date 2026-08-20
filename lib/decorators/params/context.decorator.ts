import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafParamDecorator } from '../../utils/param-decorator.util';

export const TgContext: () => ParameterDecorator = createTelegrafParamDecorator(
  TelegrafParamtype.CONTEXT,
);

/** Alias for {@link TgContext}. */
export const Context = TgContext;
export const Ctx = TgContext;
