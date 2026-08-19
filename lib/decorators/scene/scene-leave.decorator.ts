import { SetMetadata } from '@nestjs/common';

import { SCENE_LEAVE_METADATA } from '../../telegraf.constants';

/** Помечает метод как обработчик выхода из сцены. */
export const SceneLeave = (): MethodDecorator =>
  SetMetadata(SCENE_LEAVE_METADATA, true);
