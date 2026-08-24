import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает следующий middleware callback.
 *
 * Тип параметра: {@link import('telegraf-hardened').MiddlewareFn}.
 */
export const TgNext: () => ParameterDecorator = createTelegrafParamDecorator(
  TelegrafParamtype.NEXT,
);

/** Alias for {@link TgNext}. */
export const Next = TgNext;
