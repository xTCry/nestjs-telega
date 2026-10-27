import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Telegraf } from 'telegraf-hardened';
import type { Context } from 'telegraf-hardened';

import { Action, Ctx, On, Update } from '../lib/decorators';
import { TelegrafModule } from '../lib/telegraf.module';
import { FakeTelegramApi } from '../lib/testing';
import { getBotToken } from '../lib/utils';

describe('FakeTelegramApi', () => {
  it('keeps two polling bots and their fake APIs isolated', async () => {
    const first = await FakeTelegramApi.start();
    const second = await FakeTelegramApi.start();
    const bots = [first, second].map((api) => {
      const bot = new Telegraf('1:test', { telegram: { apiRoot: api.url } });
      bot.on('text', (ctx) => ctx.reply('received'));
      return bot;
    });
    const launches = bots.map((bot) => bot.launch());
    try {
      await Promise.all([first.waitForPolling(), second.waitForPolling()]);
      first.pushText({ id: 42 }, 'first');
      second.pushText({ id: 43 }, 'second');
      expect((await first.waitForCall('sendMessage')).params.chat_id).toBe(42);
      expect((await second.waitForCall('sendMessage')).params.chat_id).toBe(43);
    } finally {
      bots.forEach((bot) => bot.stop());
      await Promise.all(launches);
      await Promise.all([first.close(), second.close()]);
    }
  }, 15000);

  it('dispatches updates through real polling, middleware and Nest handlers', async () => {
    const api = await FakeTelegramApi.start();
    const middleware = jest.fn();
    @Update()
    class TestUpdate {
      @On('text')
      async onText(@Ctx() ctx: Context) {
        await ctx.reply('Hello');
      }

      @Action('confirm')
      async onAction(@Ctx() ctx: Context) {
        await ctx.answerCbQuery('Done');
      }
    }
    @Module({ providers: [TestUpdate] })
    class UpdatesModule {}
    const app = await Test.createTestingModule({
      imports: [
        UpdatesModule,
        TelegrafModule.forRoot({
          token: '1:test',
          launchOptions: false,
          options: { telegram: { apiRoot: api.url } },
          include: [UpdatesModule],
          middlewaresBefore: [
            async (_ctx, next) => {
              middleware();
              return next();
            },
          ],
        }),
      ],
    }).compile();
    let launch: Promise<void> | undefined;
    try {
      await app.init();
      const bot = app.get<Telegraf>(getBotToken());
      launch = bot.launch();
      await api.waitForPolling();
      const user = { id: 42, firstName: 'Test' };
      const message = api.pushText(user, 'Hi');
      const sent = await api.waitForCall('sendMessage');
      expect(sent.params).toMatchObject({ chat_id: 42, text: 'Hello' });
      expect(middleware).toHaveBeenCalled();
      const id = api.pushCallback(user, 'confirm', message);
      expect(
        (await api.waitForCall('answerCallbackQuery')).params,
      ).toMatchObject({ callback_query_id: id, text: 'Done' });
      bot.stop();
      await launch;
    } finally {
      await app.close();
      await api.close();
    }
  }, 15000);

  it('supports errors, custom methods, reset and closing pending waiters', async () => {
    const api = await FakeTelegramApi.start();
    try {
      const bot = new Telegraf('1:test', { telegram: { apiRoot: api.url } });
      api.onMethod('getChat', (params) => ({
        id: params.chat_id,
        type: 'private',
        first_name: 'Custom',
      }));
      expect(await bot.telegram.getChat(42)).toMatchObject({
        id: 42,
        first_name: 'Custom',
      });
      api.failNext('sendMessage', {
        error_code: 400,
        description: 'Bad Request',
      });
      await expect(bot.telegram.sendMessage(42, 'Hello')).rejects.toThrow(
        '400',
      );
      await expect(api.waitForCall('never', () => true, 5)).rejects.toThrow(
        'Timed out',
      );
      api.reset();
      expect(api.calls).toHaveLength(0);
      const pending = api.waitForCall('never');
      const rejected = expect(pending).rejects.toThrow('closed');
      await api.close();
      await rejected;
    } finally {
      await api.close();
    }
  });
});
