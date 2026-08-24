import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafParamDecorator } from '../../utils/param-decorator.util';

/**
 * Извлекает текущий Telegraf context.
 *
 * Тип параметра: {@link import('telegraf-hardened').Context}. Для собственного
 * context расширьте этот интерфейс и укажите свой тип параметра.
 */
export const TgContext: () => ParameterDecorator = createTelegrafParamDecorator(
  TelegrafParamtype.CONTEXT,
);

/** Alias for {@link TgContext}. */
export const Context = TgContext;
export const Ctx = TgContext;
