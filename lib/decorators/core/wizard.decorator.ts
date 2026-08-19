import type { Context } from 'telegraf';
import type { SceneOptions } from 'telegraf/typings/scenes/base';

import { SceneMetadataDecorator } from './scene.decorator';

type WizardDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
) => ClassDecorator;

export const Wizard: WizardDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
): ClassDecorator =>
  SceneMetadataDecorator({ sceneId, type: 'wizard', options });
