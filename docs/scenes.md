# Scenes and wizards

Scenes keep a short-lived conversational state between updates. Register a
scene provider with `@Scene()` or `@Wizard()`; the module discovers it and adds
it to the bot stage automatically.

The context type must include Telegraf's scene context. For a base scene use
`Scenes.SceneContext`; for a wizard use `Scenes.WizardContext`.

## Base scene

```ts title="src/profile.scene.ts"
import { Ctx, On, Scene, SceneEnter, SceneLeave } from 'nestjs-telega';
import type { Scenes } from 'telegraf-hardened';

const PROFILE_SCENE_ID = 'profile';

@Scene(PROFILE_SCENE_ID)
export class ProfileScene {
  @SceneEnter()
  onEnter(): string {
    return 'Send a display name, or use /leave to cancel.';
  }

  @On('text')
  async onName(@Ctx() ctx: Scenes.SceneContext): Promise<void> {
    await ctx.reply(`Saved: ${ctx.text}`);
    await ctx.scene.leave();
  }

  @SceneLeave()
  onLeave(): string {
    return 'Profile flow finished.';
  }
}
```

Enter it from any update handler:

```ts
@Command('profile')
onProfile(@Ctx() ctx: Scenes.SceneContext): Promise<unknown> {
  return ctx.scene.enter(PROFILE_SCENE_ID);
}
```

## Wizard scene

Wizard scenes model ordered steps. Decorate each step with `@WizardStep()`;
call `ctx.wizard.next()` when it is time to move forward.

```ts title="src/order.wizard.ts"
import { Ctx, Wizard, WizardStep } from 'nestjs-telega';
import type { Scenes } from 'telegraf-hardened';

@Wizard('order')
export class OrderWizard {
  @WizardStep(0)
  onProduct(@Ctx() ctx: Scenes.WizardContext): string {
    ctx.wizard.next();
    return 'Which product would you like?';
  }

  @WizardStep(1)
  async onQuantity(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    await ctx.reply(`Order received: ${ctx.text}`);
    await ctx.scene.leave();
  }
}
```

## Session storage

Telegraf scenes require session middleware. Add it before discovered handlers:

```ts
import { session } from 'telegraf-hardened';

TelegrafModule.forRoot({
  token: process.env.TELEGRAM_BOT_TOKEN!,
  middlewaresBefore: [session()],
});
```

The built-in Telegraf session middleware stores data in memory. For production,
provide a storage implementation appropriate for your deployment and protect
scene state from untrusted input.
