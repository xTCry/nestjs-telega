import type { Context } from 'telegraf-hardened';
import type { SceneOptions } from 'telegraf-hardened/scenes';

import { SceneMetadataDecorator } from './scene.decorator';

type WizardDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
) => ClassDecorator;

export const TgWizard: WizardDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
): ClassDecorator =>
  SceneMetadataDecorator({ sceneId, type: 'wizard', options });

/** Alias for {@link TgWizard}. */
export const Wizard = TgWizard;
