import type { Context } from 'telegraf';
import type { SceneOptions } from 'telegraf/typings/scenes/base';

export interface SceneMetadata {
  sceneId: string;
  type: 'base' | 'wizard';
  options?: SceneOptions<Context>;
}

export interface WizardStepMetadata {
  step: number;
}
