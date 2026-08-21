import {
  Ctx,
  Message,
  On,
  TelegrafListenerResult,
  Wizard,
  WizardStep,
} from 'nestjs-telega';
import type { Scenes } from 'telegraf-hardened';

import { WIZARD_SCENE_ID } from '../../app.constants';

@Wizard(WIZARD_SCENE_ID)
export class GreeterWizard {
  @WizardStep(1)
  async onSceneEnter(
    @Ctx() ctx: Scenes.WizardContext,
  ): Promise<TelegrafListenerResult> {
    console.log('Enter to scene');
    await ctx.wizard.next();
    return 'Welcome to wizard scene ✋ Send me your name';
  }

  @On('text')
  @WizardStep(2)
  async onName(
    @Ctx() ctx: Scenes.WizardContext,
    @Message() msg: { text: string },
  ): Promise<TelegrafListenerResult> {
    console.log('Enter to step 1');
    ctx.wizard.state['name'] = msg.text;
    await ctx.wizard.next();
    return 'Send me where are you from';
  }

  @On('text')
  @WizardStep(3)
  async onLocation(
    @Ctx()
    ctx: Scenes.WizardContext & { wizard: { state: { name: string } } },
    @Message() msg: { text: string },
  ): Promise<TelegrafListenerResult> {
    console.log('Enter to step 3');
    await ctx.scene.leave();
    return `Hello ${ctx.wizard.state.name} from ${msg.text}. I'm Greater bot from 127.0.0.1 👋`;
  }
}
