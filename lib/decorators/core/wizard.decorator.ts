import type { Context } from 'telegraf-hardened';
import type { SceneOptions } from 'telegraf-hardened/scenes';

import { SceneMetadataDecorator } from './scene.decorator';

type WizardDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
) => ClassDecorator;

/**
 * Регистрирует WizardScene с указанным ID.
 *
 * Тип `options`: {@link import('telegraf-hardened/scenes').SceneOptions};
 * тип `@Ctx()` внутри steps — {@link import('telegraf-hardened').Scenes.WizardContext}.
 */
export const TgWizard: WizardDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
): ClassDecorator =>
  SceneMetadataDecorator({ sceneId, type: 'wizard', options });

/** Alias for {@link TgWizard}. */
export const Wizard = TgWizard;
