import {
  Action,
  Command,
  Ctx,
  Message,
  On,
  TelegrafListenerResult,
  Wizard,
  WizardStep,
} from 'nestjs-telega';
import type { Scenes } from 'telegraf-hardened';

import { WIZARD_SCENE_ID } from '../../app.constants';
import { createGreeterMenu, createWizardKeyboard } from '../greeter-keyboard';

@Wizard(WIZARD_SCENE_ID)
export class GreeterWizard {
  @WizardStep(1)
  async onSceneEnter(
    @Ctx() ctx: Scenes.WizardContext,
  ): Promise<TelegrafListenerResult> {
    await ctx.wizard.next();
    return {
      text: 'Greeting wizard · Step 1 of 2\n\nSend me your name, or cancel to return to the examples.',
      extra: createWizardKeyboard(),
    };
  }

  @On('text')
  @WizardStep(2)
  async onName(
    @Ctx() ctx: Scenes.WizardContext,
    @Message() msg: { text: string },
  ): Promise<TelegrafListenerResult> {
    ctx.wizard.state['name'] = msg.text;
    await ctx.wizard.next();
    return {
      text: 'Greeting wizard · Step 2 of 2\n\nSend me where are you from, or cancel to return to the examples.',
      extra: createWizardKeyboard(),
    };
  }

  @On('text')
  @WizardStep(3)
  async onLocation(
    @Ctx()
    ctx: Scenes.WizardContext & { wizard: { state: { name: string } } },
    @Message() msg: { text: string },
  ): Promise<TelegrafListenerResult> {
    const name = ctx.wizard.state.name;
    await ctx.scene.leave();
    return {
      text: `Hello ${name} from ${msg.text}!\n\nGreeting complete. Choose another example:`,
      extra: createGreeterMenu(),
    };
  }

  @Action('wizard:cancel')
  async onCancelAction(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    await ctx.answerCbQuery('Wizard cancelled');
    await ctx.scene.leave();
    await ctx.editMessageText(
      'Greeting wizard cancelled. Choose another example:',
      createGreeterMenu(),
    );
  }

  @Command('cancel')
  async onCancelCommand(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    await ctx.scene.leave();
    await ctx.reply(
      'Greeting wizard cancelled. Choose another example:',
      createGreeterMenu(),
    );
  }
}
