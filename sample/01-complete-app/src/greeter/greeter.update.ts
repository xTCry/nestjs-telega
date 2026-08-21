import {
  Command,
  Ctx,
  Hears,
  InlineQuery,
  On,
  Reaction,
  Sender,
  Start,
  TelegrafListenerResult,
  Update,
} from 'nestjs-telega';
import type { Types } from 'telegraf-hardened';

import { HELLO_SCENE_ID, WIZARD_SCENE_ID } from '../app.constants';
import { UpdateType } from '../common/decorators/update-type.decorator';
import { Context } from '../interfaces/context.interface';

@Update()
export class GreeterUpdate {
  @Start()
  onStart(): string {
    return 'Say hello to me';
  }

  @Hears(['hi', 'hello', 'hey', 'qq'])
  onGreetings(
    @UpdateType() updateType: Types.UpdateType,
    @Sender('first_name') firstName: string,
  ): TelegrafListenerResult {
    return `Hey ${firstName}`;
  }

  @Command('scene')
  async onSceneCommand(@Ctx() ctx: Context): Promise<TelegrafListenerResult> {
    await ctx.scene.enter(HELLO_SCENE_ID);
  }

  @Command('wizard')
  async onWizardCommand(@Ctx() ctx: Context): Promise<TelegrafListenerResult> {
    await ctx.scene.enter(WIZARD_SCENE_ID);
  }

  @Reaction('👍')
  async onThumbsUpReaction(@Ctx() ctx: Context & { match: string }) {
    const reaction = ctx.reactions.added.toArray()[0];
    await ctx.reply(
      `Thanks for the ${ctx.match} reaction: ${JSON.stringify(reaction)}`,
    );
  }

  @On('business_message')
  onBusinessMessage(@Ctx() ctx: Context): void {
    console.log(
      `Business message received for connection ${ctx.bizConnId ?? 'unknown'}`,
    );
  }

  @InlineQuery(/.*/)
  onInlineQuery(): TelegrafListenerResult {
    return {
      inlineQuery: {
        results: [
          {
            id: 'greeter',
            type: 'article',
            title: 'Send greeting',
            input_message_content: {
              message_text: 'Hello from nestjs-telega!',
            },
          },
        ],
      },
    };
  }
}
