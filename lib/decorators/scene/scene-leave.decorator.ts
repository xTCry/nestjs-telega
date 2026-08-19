import { Reflector } from '@nestjs/core';

/** Помечает метод как обработчик выхода из сцены. */
export const SceneLeave = Reflector.createDecorator();
