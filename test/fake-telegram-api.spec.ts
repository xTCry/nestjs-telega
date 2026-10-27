import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Telegraf } from 'telegraf-hardened';
import type { Context } from 'telegraf-hardened';

import { Action, Ctx, On, Update } from '../lib/decorators';
import { TelegrafModule } from '../lib/telegraf.module';
import { FakeTelegramApi } from '../lib/testing';
import { getBotToken } from '../lib/utils';

describe('FakeTelegramApi', () => {
  it('supports the schedule bot request formats and stateful keyboard lifecycle', async () => {
    const api = await FakeTelegramApi.start({
      botInfo: { id: 900001, username: 'schedule_bot' },
      fallback: () => true,
    });
    const call = async (
      method: string,
      body: BodyInit,
      headers?: HeadersInit,
    ) => {
      const response = await fetch(`${api.url}/bot1:test/${method}`, {
        method: 'POST',
        body,
        headers,
      });
      return response.json() as Promise<{ ok: boolean; result: unknown }>;
    };
    try {
      expect(
        (await call('getMe', '{}', { 'content-type': 'application/json' }))
          .result,
      ).toMatchObject({ id: 900001, username: 'schedule_bot' });
      const markup = {
        inline_keyboard: [[{ text: 'Open', callback_data: 'open' }]],
      };
      const sent = await call(
        'sendMessage',
        new URLSearchParams({
          chat_id: '42',
          text: 'Menu',
          reply_markup: JSON.stringify(markup),
        }),
      );
      expect(sent.result).toMatchObject({
        chat: { id: 42 },
        reply_markup: markup,
      });
      const message = api.getMessageWithCallback('open');
      expect(message).toBeDefined();
      const form = new FormData();
      form.set('chat_id', '42');
      form.set('reply_markup', JSON.stringify(markup));
      form.set('photo', new Blob(['file bytes']), 'photo.txt');
      await call('sendPhoto', form);
      expect((await api.waitForCall('sendPhoto')).params).toMatchObject({
        chat_id: '42',
        reply_markup: markup,
      });
      await call(
        'deleteMessage',
        JSON.stringify({ chat_id: 42, message_id: message!.message_id }),
        { 'content-type': 'application/json' },
      );
      expect(api.getMessageWithCallback('open')).toBeUndefined();
      expect(
        (
          await call('setMyCommands', JSON.stringify({ commands: [] }), {
            'content-type': 'application/json',
          })
        ).result,
      ).toBe(true);
      api.reset();
      api.pushText({ id: 42 }, 'Hello');
      const next = await call(
        'sendMessage',
        JSON.stringify({ chat_id: 42, text: 'Again' }),
        { 'content-type': 'application/json' },
      );
      expect(
        (next.result as { message_id: number }).message_id,
      ).toBeGreaterThan(message!.message_id);
      expect(() =>
        api.pushBotChatMembership({ id: 42 }, { id: 42, type: 'private' }),
      ).toThrow();
    } finally {
      await api.close();
    }
  });

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

  it('handles group updates, callback edits and edit failure fallback through polling', async () => {
    const api = await FakeTelegramApi.start();
    const bot = new Telegraf('1:test', { telegram: { apiRoot: api.url } });
    bot.on('my_chat_member', (ctx) => ctx.reply('Welcome'));
    bot.on('text', (ctx) =>
      ctx.reply('Menu', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Open', callback_data: 'open' }]],
        },
      }),
    );
    bot.action('open', async (ctx) => {
      await ctx.answerCbQuery();
      try {
        await ctx.editMessageText('Updated', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Next', callback_data: 'next' }]],
          },
        });
      } catch {
        await ctx.reply('Fallback');
      }
    });
    const launch = bot.launch();
    try {
      await api.waitForPolling();
      const chat = { id: -100, type: 'supergroup' as const, title: 'Group' };
      const user = { id: 42 };
      api.pushBotChatMembership(user, chat);
      expect((await api.waitForCall('sendMessage')).result).toMatchObject({
        chat,
      });
      const after = api.calls.length;
      api.pushChatText(user, chat, '/start@test_bot');
      const sent = await api.waitForNextCall(after, 'sendMessage');
      const message = api.getMessageWithCallback('open');
      expect(message?.chat).toMatchObject(chat);
      expect(sent.result).toMatchObject({
        reply_markup: { inline_keyboard: expect.any(Array) },
      });
      api.pushCallback(user, 'open', message!);
      await api.waitForCall('editMessageText');
      expect(api.getMessageWithCallback('next')?.message_id).toBe(
        message!.message_id,
      );
      api.failNext('editMessageText', {
        error_code: 400,
        description: 'message unavailable',
      });
      const beforeFallback = api.calls.length;
      api.pushCallback(user, 'open', message!);
      expect(
        (await api.waitForNextCall(beforeFallback, 'sendMessage')).params,
      ).toMatchObject({ chat_id: chat.id, text: 'Fallback' });
    } finally {
      bot.stop();
      await launch;
      await api.close();
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
