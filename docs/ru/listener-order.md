# Порядок listener-ов

`@Update()`-обработчики находятся среди NestJS provider-ов. В Telegraf порядок
регистрации определяет порядок выполнения middleware. Если подходящий ранний
обработчик не вызвал `next()`, последующие обработчики не выполняются.

Обработчики без декораторов порядка сохраняют существующий порядок discovery.
Указывайте следующие опциональные декораторы только когда порядок между
модулями нужно задать явно.

## Фаза и приоритет

`@ListenerPhase()` задаёт фазу. По умолчанию используется `normal`; `fallback`
всегда регистрируется после всех обработчиков `normal`. `@ListenerPriority()`
задаёт порядок внутри фазы: меньшие значения регистрируются раньше, значение
по умолчанию — `0`. При равных значениях сохраняется порядок discovery.

```ts
import {
  Ctx,
  ListenerPhase,
  ListenerPriority,
  Next,
  On,
  Update,
} from 'nestjs-telega';
import type { Context } from 'telegraf-hardened';

@Update()
export class PrivateMessagesUpdate {
  @ListenerPriority(-10)
  @On('text')
  async handleKnownText(
    @Ctx() ctx: Context,
    @Next() next: () => Promise<void>,
  ): Promise<void> {
    if (ctx.message.text === 'known') {
      await ctx.reply('Обработано');
      return;
    }

    await next();
  }

  @ListenerPhase('fallback')
  @On('text')
  async handleUnhandledText(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply('Я пока не понимаю это сообщение.');
  }
}
```

Итоговый порядок регистрации: фаза → приоритет → порядок discovery. `fallback`
не заставляет предыдущие обработчики вызвать `next()`: обработчик, завершивший
цепочку, по-прежнему не пропустит update до fallback.

Этот порядок применяется только к `@Update()`-обработчикам. `@Composer()`
выполняется до stage сцен, а порядок `@WizardStep()` по-прежнему задаёт номер
шага.

## Диагностика регистрации

Передайте опциональный callback, чтобы увидеть фактический отсортированный
порядок без чтения внутренних структур Telegraf:

```ts
TelegrafModule.forRoot({
  token: process.env.TELEGRAM_BOT_TOKEN!,
  listenerDiagnostics: {
    onRegistered(listener) {
      console.info(
        `#${listener.registrationIndex} ${listener.phase} ` +
          `${listener.moduleName}.${listener.providerName}.` +
          `${listener.methodName} -> ${listener.listenerMethod}`,
      );
    },
  },
});
```

Descriptor содержит module, provider, метод, аргументы декоратора и оба
индекса. В него никогда не попадают bot token, payload update или callback
middleware.
