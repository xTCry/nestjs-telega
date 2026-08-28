import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telega';

import { BusinessBotName } from './app.constants';
import { BusinessModule } from './business/business.module';
import { logListenerRegistration } from './common/listener-diagnostics';
import { EchoModule } from './echo/echo.module';
import { GreeterModule } from './greeter/greeter.module';
import { sessionMiddleware } from './middleware/session.middleware';

const businessBotToken = process.env.BUSINESS_BOT_TOKEN?.trim();
const apiRoot = process.env.TELEGRAM_API_ROOT?.trim() || undefined;

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN ?? '',
      launchOptions: {
        allowedUpdates: [
          'message',
          'business_connection',
          'callback_query',
          'inline_query',
        ],
        polling: {
          retryOnConflict: true,
        },
      },
      options: { telegram: { apiRoot } },
      middlewaresBefore: [sessionMiddleware],
      include: [EchoModule, GreeterModule],
      listenerDiagnostics: {
        onRegistered: logListenerRegistration,
      },
    }),
    ...(businessBotToken
      ? [
          TelegrafModule.forRoot({
            botName: BusinessBotName,
            token: businessBotToken,
            launchOptions: {
              allowedUpdates: [
                'message',
                'callback_query',
                'business_connection',
                'business_message',
                'edited_business_message',
                'deleted_business_messages',
                'message_reaction',
                'message_reaction_count',
              ],
              polling: {
                retryOnConflict: true,
              },
            },
            options: { telegram: { apiRoot } },
            middlewaresBefore: [sessionMiddleware],
            include: [BusinessModule],
            listenerDiagnostics: {
              onRegistered: logListenerRegistration,
            },
          }),
          BusinessModule,
        ]
      : []),
    EchoModule,
    GreeterModule,
  ],
})
export class AppModule {}
