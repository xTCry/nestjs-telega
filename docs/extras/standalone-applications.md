# Standalone applications

If the application uses long polling only, NestJS does not need an HTTP server.
Create a standalone application context instead of an Express application:

```ts
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
}
bootstrap();
```

This starts Nest without network listeners. Do not use this setup for webhooks.

After confirming that nothing else needs Express, remove its unused packages:

```bash
npm un @nestjs/platform-express @types/express
```

:::info
See the [Nest standalone applications documentation](https://docs.nestjs.com/standalone-applications).
:::
