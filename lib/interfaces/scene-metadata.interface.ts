import type { Context } from 'telegraf-hardened';
import type { SceneOptions } from 'telegraf-hardened/scenes';

export interface SceneMetadata {
  sceneId: string;
  type: 'base' | 'wizard';
  options?: SceneOptions<Context>;
}

export interface WizardStepMetadata {
  step: number;
}
