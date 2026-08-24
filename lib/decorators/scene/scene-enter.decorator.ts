import { Reflector } from '@nestjs/core';

/**
 * Помечает метод как обработчик входа в сцену.
 *
 * Тип `@Ctx()` параметра: {@link import('telegraf-hardened').Scenes.SceneContext}
 * или {@link import('telegraf-hardened').Scenes.WizardContext}. В wizard
 * `ctx.wizard` создаётся после enter lifecycle, поэтому не используйте его здесь.
 */
export const TgSceneEnter = Reflector.createDecorator();

/** Alias for {@link TgSceneEnter}. */
export const SceneEnter = TgSceneEnter;
