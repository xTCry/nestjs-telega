import { Provider } from '@nestjs/common';
import { Scenes } from 'telegraf-hardened';

import { getTelegrafStageToken } from './utils';

export const createTelegrafStageProvider = (botName?: string): Provider => ({
  provide: getTelegrafStageToken(botName),
  useClass: Scenes.Stage,
});

/** @deprecated Использовать createTelegrafStageProvider для named bot instance. */
export const telegrafStageProvider = createTelegrafStageProvider();
