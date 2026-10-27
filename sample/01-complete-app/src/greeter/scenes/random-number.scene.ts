import {
  Action,
  Command,
  Ctx,
  Scene,
  SceneEnter,
  TelegrafListenerResult,
} from 'nestjs-telega';

import { HELLO_SCENE_ID } from '../../app.constants';
import { Context } from '../../interfaces/context.interface';
import { createGreeterMenu, createSceneKeyboard } from '../greeter-keyboard';

@Scene(HELLO_SCENE_ID)
export class RandomNumberScene {
  @SceneEnter()
  onSceneEnter(): TelegrafListenerResult {
    return {
      text: 'Random number example\n\nChoose Generate number, or use /random. Return to the examples menu when you are done.',
      extra: createSceneKeyboard(),
    };
  }

  @Command(['rand', 'rnd', 'rng', 'random'])
  onRandomCommand(): TelegrafListenerResult {
    return {
      text: `Your number: ${Math.floor(Math.random() * 11)}\n\nGenerate another or return to the examples.`,
      extra: createSceneKeyboard(),
    };
  }

  @Action('scene:random')
  async onRandomAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    const text = ctx.msg && 'text' in ctx.msg ? (ctx.msg.text ?? '') : '';
    const previous = /^Your number: (\d+)/.exec(text)?.[1];
    const number =
      previous === undefined
        ? Math.floor(Math.random() * 11)
        : (Number(previous) + 1 + Math.floor(Math.random() * 10)) % 11;
    await ctx.editMessageText(
      `Your number: ${number}\n\nGenerate another or return to the examples.`,
      createSceneKeyboard(),
    );
  }

  @Action('scene:leave')
  async onLeaveAction(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    await ctx.editMessageText(
      'Random number example closed. Choose another example:',
      createGreeterMenu(),
    );
  }

  @Command('leave')
  async onLeaveCommand(@Ctx() ctx: Context): Promise<void> {
    await ctx.scene.leave();
    await ctx.reply(
      'Random number example closed. Choose another example:',
      createGreeterMenu(),
    );
  }
}
