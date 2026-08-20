import { Reflector } from '@nestjs/core';
import type { Context } from 'telegraf';
import type { SceneOptions } from 'telegraf/typings/scenes/base';

import { SceneMetadata } from '../../interfaces';

/** Внутренний reflectable decorator общего metadata base- и wizard-сцен. */
export const SceneMetadataDecorator =
  Reflector.createDecorator<SceneMetadata>();

export type SceneDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
) => ClassDecorator;

export const TgScene: SceneDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
): ClassDecorator => SceneMetadataDecorator({ sceneId, type: 'base', options });

/** Alias for {@link TgScene}. */
export const Scene = TgScene;
