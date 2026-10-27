import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Ctx, getBotToken, On, TelegrafModule, Update } from 'nestjs-telega';
import { FakeTelegramApi } from 'nestjs-telega/testing';
import { Context, Telegraf } from 'telegraf-hardened';

@Update()
class ExampleUpdate {
  @On('text')
  async onText(@Ctx() ctx: Context) {
    await ctx.reply('Hello from Nest');
  }
}

@Module({ providers: [ExampleUpdate] })
class ExampleUpdatesModule {}

describe('Telegram polling example', () => {
  it('routes an update through the bot and records the reply', async () => {
    const api = await FakeTelegramApi.start();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ExampleUpdatesModule,
        TelegrafModule.forRoot({
          token: '1:test-token',
          options: { telegram: { apiRoot: api.url } },
          launchOptions: false,
          include: [ExampleUpdatesModule],
        }),
      ],
    }).compile();

    try {
      await moduleRef.init();
      const bot = moduleRef.get<Telegraf>(getBotToken());
      const polling = bot.launch();
      await api.waitForPolling();
      api.pushText({ id: 42 }, 'Hello');
      expect((await api.waitForCall('sendMessage')).params).toMatchObject({
        chat_id: 42,
        text: 'Hello from Nest',
      });
      bot.stop();
      await polling;
    } finally {
      await moduleRef.close();
      await api.close();
    }
  });
});
