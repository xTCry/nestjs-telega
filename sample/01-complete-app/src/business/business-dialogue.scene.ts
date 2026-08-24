import { Ctx, On, Scene, SceneEnter, SceneLeave } from 'nestjs-telega';

import { BUSINESS_DIALOGUE_SCENE_ID } from '../app.constants';
import { Context } from '../interfaces/context.interface';

/** Простая сцена показывает, что Business updates могут использовать Stage. */
@Scene(BUSINESS_DIALOGUE_SCENE_ID)
export class BusinessDialogueScene {
  @SceneEnter()
  onEnter(): string {
    return 'Dialogue mode is on. Send a message or use /leave.';
  }

  @On('business_message')
  async onBusinessMessage(@Ctx() ctx: Context): Promise<string | void> {
    if (ctx.text?.startsWith('/leave')) {
      await ctx.scene.leave();
      return;
    }

    return `Dialogue received: ${ctx.text ?? ''}`;
  }

  @SceneLeave()
  onSceneLeave(): string {
    return 'Dialogue mode is off.';
  }
}
