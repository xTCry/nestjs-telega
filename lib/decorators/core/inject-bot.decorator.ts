import { Inject } from '@nestjs/common';
import { getBotToken } from '../../utils';

export const InjectBot = (botName?: string): ReturnType<typeof Inject> =>
  Inject(getBotToken(botName));
