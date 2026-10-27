import { Test } from '@nestjs/testing';
import { getBotToken, TelegrafModule } from 'nestjs-telega';
import { FakeTelegramApi } from 'nestjs-telega/testing';
import type { FakeTelegramMessage } from 'nestjs-telega/testing';
import { Telegraf } from 'telegraf-hardened';

import { GreeterModule } from '../greeter/greeter.module';
import { sessionMiddleware } from '../middleware/session.middleware';

describe('Greeter sample with local Telegram API', () => {
  it('cancels the wizard and navigates the random scene with buttons', async () => {
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
        const user = { id: 44 };
        api.pushText(user, '/wizard');
        await api.waitForCall('sendMessage', (call) =>
          String(call.params.text).includes('Step 1 of 2'),
        );
        const wizardPrompt = api.getMessageWithCallback('wizard:cancel');
        expect(wizardPrompt).toBeDefined();
        api.pushCallback(user, 'wizard:cancel', wizardPrompt!);
        await api.waitForCall('editMessageText', (call) =>
          String(call.params.text).includes('wizard cancelled'),
        );
        const menu = api.getMessageWithCallback('greeter:scene');
        expect(menu).toBeDefined();
        api.pushCallback(user, 'greeter:scene', menu!);
        await api.waitForCall('sendMessage', (call) =>
          String(call.params.text).includes('Random number example'),
        );
        const scene = api.getMessageWithCallback('scene:random');
        expect(scene).toBeDefined();
        const after = api.calls.length;
        api.pushCallback(user, 'scene:random', scene!);
        const firstNumber = (
          await api.waitForNextCall(after, 'editMessageText')
        ).params.text;
        expect(firstNumber).toMatch(/Your number: \d+/);
        const updated = api.getMessageWithCallback('scene:leave');
        const beforeSecond = api.calls.length;
        api.pushCallback(user, 'scene:random', updated!);
        expect(
          (await api.waitForNextCall(beforeSecond, 'editMessageText')).params
            .text,
        ).not.toBe(firstNumber);
        const beforeLeave = api.calls.length;
        api.pushCallback(
          user,
          'scene:leave',
          api.getMessageWithCallback('scene:leave')!,
        );
        expect(
          (await api.waitForNextCall(beforeLeave, 'editMessageText')).params
            .text,
        ).toContain('example closed');
        expect(api.getMessageWithCallback('greeter:wizard')).toBeDefined();
        const beforeWizard = api.calls.length;
        api.pushText(user, '/wizard');
        await api.waitForNextCall(beforeWizard, 'sendMessage', (call) =>
          String(call.params.text).includes('Step 1 of 2'),
        );
        api.pushText(user, 'Alice');
        await api.waitForNextCall(beforeWizard, 'sendMessage', (call) =>
          String(call.params.text).includes('Step 2 of 2'),
        );
        const beforeCancel = api.calls.length;
        api.pushText(user, '/cancel');
        expect(
          (await api.waitForNextCall(beforeCancel, 'sendMessage')).params.text,
        ).toContain('wizard cancelled');
      } finally {
        bot.stop();
        await polling;
      }
    } finally {
      await moduleRef.close();
      await api.close();
    }
  }, 15000);

  it('sends and manages an ephemeral message for its recipient', async () => {
    const api = await FakeTelegramApi.start();
    api.onMethod('sendMessage', (params) => ({
      message_id: 0,
      ephemeral_message_id: 77,
      date: 0,
      chat: { id: params.chat_id, type: 'private', first_name: 'Test' },
      from: api.botInfo,
      receiver_user: { id: 42, is_bot: false, first_name: 'Test' },
      reply_markup: params.reply_markup,
    }));
    api.onMethod('editEphemeralMessageText', () => true);
    api.onMethod('deleteEphemeralMessage', () => true);
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
        api.pushText({ id: 42 }, '/ephemeral');
        const sent = await api.waitForCall('sendMessage');
        expect(sent.params).toMatchObject({
          chat_id: 42,
          ephemeral_message_parameters: { receiver_user_id: 42 },
        });
        const message = sent.result as FakeTelegramMessage;
        api.pushCallback({ id: 42 }, 'ephemeral:update', message);
        expect(
          (await api.waitForCall('editEphemeralMessageText')).params,
        ).toMatchObject({
          chat_id: 42,
          receiver_user_id: 42,
          ephemeral_message_id: 77,
        });
        api.pushCallback({ id: 42 }, 'ephemeral:delete', message);
        expect(
          (await api.waitForCall('deleteEphemeralMessage')).params,
        ).toMatchObject({
          chat_id: 42,
          receiver_user_id: 42,
          ephemeral_message_id: 77,
        });
        api.pushCallback({ id: 43 }, 'ephemeral:delete', message);
        expect(
          (
            await api.waitForCall('answerCallbackQuery', (call) =>
              String(call.params.text).includes('no longer available'),
            )
          ).params.text,
        ).toContain('no longer available');
        expect(
          api.calls.filter((call) => call.method === 'deleteEphemeralMessage'),
        ).toHaveLength(1);
      } finally {
        bot.stop();
        await polling;
      }
    } finally {
      await moduleRef.close();
      await api.close();
    }
  }, 15000);

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
