import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafParamDecorator } from '../../utils/param-decorator.util';

export const TgNext: () => ParameterDecorator = createTelegrafParamDecorator(
  TelegrafParamtype.NEXT,
);

/** Alias for {@link TgNext}. */
export const Next = TgNext;
