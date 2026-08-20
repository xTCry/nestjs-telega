import { Reflector } from '@nestjs/core';

/** Помечает метод как обработчик выхода из сцены. */
export const TgSceneLeave = Reflector.createDecorator();

/** Alias for {@link TgSceneLeave}. */
export const SceneLeave = TgSceneLeave;
