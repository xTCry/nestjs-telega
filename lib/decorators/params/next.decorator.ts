import { TelegrafParamtype } from '../../enums/telegraf-paramtype.enum';
import { createTelegrafParamDecorator } from '../../utils/param-decorator.util';

export const Next: () => ParameterDecorator = createTelegrafParamDecorator(
  TelegrafParamtype.NEXT,
);
