import { Test } from '@nestjs/testing';
import { Telegraf } from 'telegraf';

import { allBotsMap } from '../lib/telegraf-all-bots.provider';
import { TelegrafModule } from '../lib/telegraf.module';
import { getBotToken } from '../lib/utils';

describe('TelegrafModule', () => {
  afterEach(() => {
    allBotsMap.clear();
  });

  it('registers a named bot without launching it', async () => {
    const botName = 'reminder';
    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          botName,
          token: 'test-token',
          launchOptions: false,
        }),
      ],
    }).compile();
    const bot = moduleRef.get<Telegraf>(getBotToken(botName));
    const stop = jest.spyOn(bot, 'stop').mockImplementation(() => undefined);

    expect(allBotsMap.get(getBotToken(botName))).toBe(bot);

    await moduleRef.close();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('registers an asynchronously configured default bot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRootAsync({
          useFactory: () => ({
            token: 'test-token',
            launchOptions: false,
          }),
        }),
      ],
    }).compile();
    const bot = moduleRef.get<Telegraf>(getBotToken());
    const stop = jest.spyOn(bot, 'stop').mockImplementation(() => undefined);

    expect(allBotsMap.get(getBotToken())).toBe(bot);

    await moduleRef.close();

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
