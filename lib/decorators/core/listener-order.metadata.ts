import { Reflector } from '@nestjs/core';

import type { ListenerRegistrationPhase } from '../../interfaces';

/** Внутренний ключ metadata фазы listener-а. */
export const ListenerPhaseMetadataDecorator =
  Reflector.createDecorator<ListenerRegistrationPhase>();

/** Внутренний ключ metadata приоритета listener-а. */
export const ListenerPriorityMetadataDecorator =
  Reflector.createDecorator<number>();
