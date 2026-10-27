import { Test } from '@nestjs/testing';
import { getBotToken, TelegrafModule } from 'nestjs-telega';
import { FakeTelegramApi } from 'nestjs-telega/testing';
import type { FakeTelegramMessage } from 'nestjs-telega/testing';
import { Telegraf } from 'telegraf-hardened';

import { GreeterModule } from '../greeter/greeter.module';
import { sessionMiddleware } from '../middleware/session.middleware';

describe('Greeter sample with local Telegram API', () => {
  it('sends and edits a rich message using a callback', async () => {
    const api = await FakeTelegramApi.start();
    api.onMethod('sendRichMessage', (params) => ({
      message_id: 101,
      date: 0,
      chat: { id: params.chat_id, type: 'private', first_name: 'Test' },
      from: api.botInfo,
      reply_markup: params.reply_markup,
    }));
    const moduleRef = await Test.createTestingModule({
      imports: [
        GreeterModule,
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          options: { telegram: { apiRoot: api.url } },
          middlewaresBefore: [sessionMiddleware],
          include: [GreeterModule],
        }),
      ],
    }).compile();
    try {
      await moduleRef.init();
      const bot = moduleRef.get<Telegraf>(getBotToken());
      const polling = bot.launch();
      try {
        await api.waitForPolling();
        const user = { id: 42 };
        api.pushText(user, '/rich');
        const sent = await api.waitForCall('sendRichMessage');
        expect(sent.params).toMatchObject({
          chat_id: 42,
          rich_message: { html: expect.stringContaining('Bot API 10.3') },
        });
        const callbackId = api.pushCallback(
          user,
          'rich:update',
          sent.result as FakeTelegramMessage,
        );
        expect(
          (await api.waitForCall('answerCallbackQuery')).params
            .callback_query_id,
        ).toBe(callbackId);
        expect((await api.waitForCall('editMessageText')).params).toMatchObject(
          {
            chat_id: 42,
            message_id: 101,
            rich_message: { html: expect.stringContaining('Updated') },
          },
        );
      } finally {
        bot.stop();
        await polling;
      }
    } finally {
      await moduleRef.close();
      await api.close();
    }
  }, 15000);

  it('keeps wizard sessions separate for two users', async () => {
    const api = await FakeTelegramApi.start();
    const moduleRef = await Test.createTestingModule({
      imports: [
        GreeterModule,
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          options: { telegram: { apiRoot: api.url } },
          middlewaresBefore: [sessionMiddleware],
          include: [GreeterModule],
        }),
      ],
    }).compile();
    try {
      await moduleRef.init();
      const bot = moduleRef.get<Telegraf>(getBotToken());
      const polling = bot.launch();
      try {
        await api.waitForPolling();
        const user = { id: 42 };
        const other = { id: 43 };
        api.pushText(user, '/wizard');
        await api.waitForCall(
          'sendMessage',
          (call) =>
            call.params.chat_id === 42 &&
            String(call.params.text).includes('Send me your name'),
        );
        api.pushText(other, '/wizard');
        await api.waitForCall(
          'sendMessage',
          (call) =>
            call.params.chat_id === 43 &&
            String(call.params.text).includes('Send me your name'),
        );
        api.pushText(user, 'Alice');
        api.pushText(other, 'Bob');
        await api.waitForCall(
          'sendMessage',
          (call) =>
            call.params.chat_id === 42 &&
            String(call.params.text).includes('where are you from'),
        );
        await api.waitForCall(
          'sendMessage',
          (call) =>
            call.params.chat_id === 43 &&
            String(call.params.text).includes('where are you from'),
        );
        api.pushText(user, 'Moscow');
        api.pushText(other, 'Paris');
        expect(
          (
            await api.waitForCall(
              'sendMessage',
              (call) =>
                call.params.chat_id === 42 &&
                String(call.params.text).includes('Alice from Moscow'),
            )
          ).params.text,
        ).toContain('Alice from Moscow');
        expect(
          (
            await api.waitForCall(
              'sendMessage',
              (call) =>
                call.params.chat_id === 43 &&
                String(call.params.text).includes('Bob from Paris'),
            )
          ).params.text,
        ).toContain('Bob from Paris');
      } finally {
        bot.stop();
        await polling;
      }
    } finally {
      await moduleRef.close();
      await api.close();
    }
  }, 15000);
});
