# Standalone-приложения

Если приложение использует только long polling, NestJS не нужен HTTP-сервер.
Создайте standalone application context вместо Express-приложения:

```ts
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
}
bootstrap();
```

Так Nest запускается без сетевых listeners. Эта схема не подходит для webhook.

После проверки, что Express больше нигде не нужен, можно удалить неиспользуемые
пакеты:

```bash
npm uninstall @nestjs/platform-express @types/express
```

:::info
Подробнее: [standalone applications в Nest](https://docs.nestjs.com/standalone-applications).
:::
