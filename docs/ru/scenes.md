# Сцены и wizard-ы

Сцены сохраняют краткоживущее состояние диалога между update-ами. Зарегистрируйте
provider сцены через `@Scene()` или `@Wizard()` — модуль сам найдёт его и
добавит в stage bot.

Тип context должен содержать scene context Telegraf. Для обычной сцены
используйте `Scenes.SceneContext`, для wizard — `Scenes.WizardContext`.

## Обычная сцена

```ts title="src/profile.scene.ts"
import { Ctx, On, Scene, SceneEnter, SceneLeave } from 'nestjs-telega';
import type { Scenes } from 'telegraf-hardened';

const PROFILE_SCENE_ID = 'profile';

@Scene(PROFILE_SCENE_ID)
export class ProfileScene {
  @SceneEnter()
  onEnter(): string {
    return 'Отправьте отображаемое имя или используйте /leave для отмены.';
  }

  @On('text')
  async onName(@Ctx() ctx: Scenes.SceneContext): Promise<void> {
    await ctx.reply(`Сохранено: ${ctx.text}`);
    await ctx.scene.leave();
  }

  @SceneLeave()
  onLeave(): string {
    return 'Диалог редактирования профиля завершён.';
  }
}
```

Войти в сцену можно из любого update handler:

```ts
@Command('profile')
onProfile(@Ctx() ctx: Scenes.SceneContext): Promise<unknown> {
  return ctx.scene.enter(PROFILE_SCENE_ID);
}
```

## Wizard-сцена

Wizard-сцена моделирует последовательные шаги. Пометьте каждый шаг
`@WizardStep()` и вызовите `ctx.wizard.next()`, когда нужно перейти дальше.

```ts title="src/order.wizard.ts"
import { Ctx, Wizard, WizardStep } from 'nestjs-telega';
import type { Scenes } from 'telegraf-hardened';

@Wizard('order')
export class OrderWizard {
  @WizardStep(0)
  onProduct(@Ctx() ctx: Scenes.WizardContext): string {
    ctx.wizard.next();
    return 'Какой товар вы хотите заказать?';
  }

  @WizardStep(1)
  async onQuantity(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    await ctx.reply(`Заказ получен: ${ctx.text}`);
    await ctx.scene.leave();
  }
}
```

## Хранение session

Для Telegraf scenes необходим session middleware. Подключите его до найденных
обработчиков:

```ts
import { session } from 'telegraf-hardened';

TelegrafModule.forRoot({
  token: process.env.TELEGRAM_BOT_TOKEN!,
  middlewaresBefore: [session()],
});
```

Стандартный session middleware Telegraf хранит данные в памяти. Для production
подключите storage, подходящий вашему окружению, и не доверяйте состоянию сцены
без валидации.
