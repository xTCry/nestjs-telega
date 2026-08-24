import { Reflector } from '@nestjs/core';
import type { Context } from 'telegraf-hardened';
import type { SceneOptions } from 'telegraf-hardened/scenes';

import { SceneMetadata } from '../../interfaces';

/** Внутренний reflectable decorator общего metadata base- и wizard-сцен. */
export const SceneMetadataDecorator =
  Reflector.createDecorator<SceneMetadata>();

export type SceneDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
) => ClassDecorator;

/**
 * Регистрирует BaseScene с указанным ID.
 *
 * Тип `options`: {@link import('telegraf-hardened/scenes').SceneOptions};
 * тип `@Ctx()` внутри handlers — {@link import('telegraf-hardened').Scenes.SceneContext}.
 */
export const TgScene: SceneDecorator = (
  sceneId: string,
  options?: SceneOptions<Context>,
): ClassDecorator => SceneMetadataDecorator({ sceneId, type: 'base', options });

/** Alias for {@link TgScene}. */
export const Scene = TgScene;
