# Асинхронная конфигурация

Используйте `forRootAsync()`, если token или другие параметры модуля поступают
из Nest configuration providers. Поддерживаются стандартные паттерны
`useFactory`, `useClass` и `useExisting`.

## `useFactory`

Factory может быть синхронной или асинхронной и получать зависимости через
injection:

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

Если логика подготовки параметров заслуживает отдельного provider, создайте
класс с интерфейсом `TelegrafOptionsFactory`:

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

Чтобы переиспользовать provider, зарегистрированный другим модулем, примените
`useExisting`:

```ts
TelegrafModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: TelegrafConfigService,
});
```

`botName` доступен при любом асинхронном способе регистрации. При регистрации
нескольких instance смотрите раздел [несколько ботов](/ru/extras/multiple-bots).
