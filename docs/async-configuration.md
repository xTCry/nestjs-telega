# Async configuration

Use `forRootAsync()` when the bot token or module options come from Nest
configuration providers. It supports the standard `useFactory`, `useClass` and
`useExisting` patterns.

## `useFactory`

The factory may be synchronous or asynchronous and can inject dependencies:

```ts
TelegrafModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
  }),
  inject: [ConfigService],
});
```

## `useClass`

Provide a class implementing `TelegrafOptionsFactory` when the option-building
logic deserves its own provider:

```ts
TelegrafModule.forRootAsync({
  useClass: TelegrafConfigService,
});

@Injectable()
class TelegrafConfigService implements TelegrafOptionsFactory {
  createTelegrafOptions(): TelegrafModuleOptions {
    return {
      token: process.env.TELEGRAM_BOT_TOKEN!,
    };
  }
}
```

## `useExisting`

To reuse a provider already registered by another module, use `useExisting`:

```ts
TelegrafModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: TelegrafConfigService,
});
```

`botName` is available for all async registration styles. See
[multiple bots](/extras/multiple-bots) when registering more than one instance.
