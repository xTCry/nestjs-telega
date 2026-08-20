import { Reflector } from '@nestjs/core';

/** Помечает метод как обработчик входа в сцену. */
export const TgSceneEnter = Reflector.createDecorator();

/** Alias for {@link TgSceneEnter}. */
export const SceneEnter = TgSceneEnter;
