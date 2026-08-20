import { Inject } from '@nestjs/common';

import { getBotToken } from '../../utils';

export const TgInjectBot = (botName?: string): ReturnType<typeof Inject> =>
  Inject(getBotToken(botName));

/** Alias for {@link TgInjectBot}. */
export const InjectBot = TgInjectBot;
