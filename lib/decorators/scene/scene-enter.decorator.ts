import { SetMetadata } from '@nestjs/common';
import { SCENE_ENTER_METADATA } from '../../telegraf.constants';

/** Помечает метод как обработчик входа в сцену. */
export const SceneEnter = (): MethodDecorator =>
  SetMetadata(SCENE_ENTER_METADATA, true);
