import { Reflector } from '@nestjs/core';

/**
 * Помечает метод как обработчик выхода из сцены.
 *
 * Тип `@Ctx()` параметра: {@link import('telegraf-hardened').Scenes.SceneContext}
 * или {@link import('telegraf-hardened').Scenes.WizardContext}.
 */
export const TgSceneLeave = Reflector.createDecorator();

/** Alias for {@link TgSceneLeave}. */
export const SceneLeave = TgSceneLeave;
