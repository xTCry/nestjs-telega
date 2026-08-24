import {
  Action,
  Command,
  Ctx,
  Message,
  On,
  SceneEnter,
  Wizard,
  WizardStep,
} from 'nestjs-telega';
import type { Scenes } from 'telegraf-hardened';
import type { Sticker } from 'telegraf-hardened/types';

import { ADMIN_RESPONSE_WIZARD_SCENE_ID } from '../app.constants';
import {
  BusinessResponsesStore,
  isReactionEmoji,
} from '../business-responses/business-responses.store';
import {
  BusinessResponseCategory,
  BusinessResponsesConfig,
  getCategoryLabel,
} from '../business-responses/business-responses.types';
import {
  renderAdminDashboard,
  renderResponseConfirmation,
  renderResponseInputPrompt,
} from './admin-keyboard';

type ResponseWizardState = {
  category: BusinessResponseCategory;
  value?: string;
  /** ID панели, которую редактируем вместо отправки новых wizard-сообщений. */
  panelMessageId?: number;
};

type ResponseWizardContext = Scenes.WizardContext & {
  scene: Scenes.SceneContext['scene'] & { state: ResponseWizardState };
};

@Wizard(ADMIN_RESPONSE_WIZARD_SCENE_ID)
export class AdminResponseWizard {
  constructor(private readonly responsesStore: BusinessResponsesStore) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: ResponseWizardContext): Promise<void> {
    ctx.scene.state.panelMessageId = ctx.callbackQuery?.message?.message_id;
    await renderResponseInputPrompt(
      ctx,
      `Send a ${getCategoryLabel(ctx.scene.state.category)}. Use /cancel or the button below to stop.`,
    );
  }

  @On('text')
  @WizardStep(0)
  async onResponseValue(
    @Ctx() ctx: ResponseWizardContext,
    @Message('text') value: string,
  ): Promise<void> {
    if (ctx.scene.state.category === 'sticker') {
      await ctx.reply('Send the sticker itself, not its text representation.');
      return;
    }

    if (
      ctx.scene.state.category === 'reaction' &&
      !isReactionEmoji(value.trim())
    ) {
      await ctx.reply(
        'Send one supported Telegram reaction emoji, for example 👍.',
      );
      return;
    }

    ctx.scene.state.value = value.trim();
    ctx.wizard.next();
    await renderResponseConfirmation(
      ctx,
      `Save “${ctx.scene.state.value}”?`,
      ctx.scene.state.panelMessageId,
    );
  }

  @On('sticker')
  @WizardStep(0)
  async onSticker(
    @Ctx() ctx: ResponseWizardContext,
    @Message('sticker') sticker: Sticker,
  ): Promise<void> {
    if (ctx.scene.state.category !== 'sticker') {
      await ctx.reply(
        `This action expects a ${getCategoryLabel(ctx.scene.state.category)}.`,
      );
      return;
    }

    ctx.scene.state.value = sticker.file_id;
    ctx.wizard.next();
    await renderResponseConfirmation(
      ctx,
      'Save this sticker response?',
      ctx.scene.state.panelMessageId,
    );
  }

  @Action('admin:response:save')
  @WizardStep(1)
  async onSave(@Ctx() ctx: ResponseWizardContext): Promise<void> {
    if (!ctx.scene.state.value) {
      await ctx.answerCbQuery('Send a response before saving it.');
      return;
    }

    const config = await this.responsesStore.add(
      ctx.scene.state.category,
      ctx.scene.state.value,
    );
    await ctx.answerCbQuery('Response saved.');
    await ctx.scene.leave();
    await this.replyDashboard(ctx, config, 'Response saved.');
  }

  @On('text')
  @WizardStep(1)
  async onConfirmationText(@Ctx() ctx: ResponseWizardContext): Promise<void> {
    await renderResponseConfirmation(
      ctx,
      'Use the Save response or Cancel button below.',
      ctx.scene.state.panelMessageId,
    );
  }

  @Action('admin:response:cancel')
  async onCancelAction(@Ctx() ctx: ResponseWizardContext): Promise<void> {
    await ctx.answerCbQuery('Response editing cancelled.');
    await this.leaveWithDashboard(ctx, 'Response editing cancelled.');
  }

  @Command('cancel')
  async onCancel(@Ctx() ctx: ResponseWizardContext): Promise<void> {
    await this.leaveWithDashboard(ctx, 'Response editing cancelled.');
  }

  private async leaveWithDashboard(
    ctx: ResponseWizardContext,
    notice: string,
  ): Promise<void> {
    const config = await this.responsesStore.getConfig();
    await ctx.scene.leave();
    await this.replyDashboard(ctx, config, notice);
  }

  private async replyDashboard(
    ctx: ResponseWizardContext,
    config: BusinessResponsesConfig,
    notice: string,
  ): Promise<void> {
    await renderAdminDashboard(
      ctx,
      config,
      notice,
      ctx.scene.state.panelMessageId,
    );
  }
}
