import { Reflector } from '@nestjs/core';

/** Помечает метод как обработчик входа в сцену. */
export const SceneEnter = Reflector.createDecorator();
