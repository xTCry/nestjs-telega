import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telega';

import { GreeterBotName, NotifierBotName } from './app.constants';
import { EchoModule } from './echo/echo.module';
import { GreeterModule } from './greeter/greeter.module';
import { sessionMiddleware } from './middleware/session.middleware';
import { NotifierModule } from './notifier/notifier.module';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.ECHO_BOT_TOKEN,
      include: [EchoModule],
    }),
    TelegrafModule.forRootAsync({
      botName: GreeterBotName,
      useFactory: () => ({
        token: process.env.GREETER_BOT_TOKEN,
        launchOptions: {
          allowedUpdates: [
            'message',
            'inline_query',
            'message_reaction',
            'business_message',
          ],
          polling: {
            retryOnConflict: true,
          },
        },
        middlewaresBefore: [sessionMiddleware],
        include: [GreeterModule],
      }),
    }),
    TelegrafModule.forRootAsync({
      botName: NotifierBotName,
      useFactory: () => ({
        token: process.env.NOTIFIER_BOT_TOKEN,
        include: [NotifierModule],
      }),
    }),
    EchoModule,
    GreeterModule,
    NotifierModule,
  ],
})
export class AppModule {}
