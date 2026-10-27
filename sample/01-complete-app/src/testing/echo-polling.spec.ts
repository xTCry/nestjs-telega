import { Test } from '@nestjs/testing';
import { getBotToken, TelegrafModule } from 'nestjs-telega';
import { FakeTelegramApi } from 'nestjs-telega/testing';
import { Telegraf } from 'telegraf-hardened';

import { EchoModule } from '../echo/echo.module';
import { sessionMiddleware } from '../middleware/session.middleware';

describe('Echo sample with local Telegram API', () => {
  it('edits and deletes a real sample keyboard using callbacks', async () => {
    const api = await FakeTelegramApi.start();
    const moduleRef = await Test.createTestingModule({
      imports: [
        EchoModule,
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          options: { telegram: { apiRoot: api.url } },
          middlewaresBefore: [sessionMiddleware],
          include: [EchoModule],
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
        api.pushText(user, '/keyboard');
        await api.waitForCall('sendMessage');
        const message = api.getMessageWithCallback('echo:edit');
        expect(message).toBeDefined();

        const callbackId = api.pushCallback(user, 'echo:edit', message!);
        expect((await api.waitForCall('editMessageText')).params).toMatchObject(
          {
            chat_id: 42,
            message_id: message!.message_id,
            text: expect.stringContaining('declarative listener result'),
          },
        );
        expect(
          (await api.waitForCall('answerCallbackQuery')).params
            .callback_query_id,
        ).toBe(callbackId);
        const edited = api.getMessageWithCallback('echo:delete');
        expect(edited?.message_id).toBe(message!.message_id);

        const beforeDelete = api.calls.length;
        api.pushCallback(user, 'echo:delete', edited!);
        await api.waitForNextCall(beforeDelete, 'deleteMessage');
        expect(api.getMessageWithCallback('echo:delete')).toBeUndefined();
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
