import type { ListenerRegistrationPhase } from '../../interfaces';
import {
  ListenerPhaseMetadataDecorator,
  ListenerPriorityMetadataDecorator,
} from './listener-order.metadata';

/** Допустимые фазы регистрации `@Update()` listener-а. */
export type ListenerPhase = ListenerRegistrationPhase;

type ListenerPhaseDecorator = (phase: ListenerPhase) => MethodDecorator;
type ListenerPriorityDecorator = (priority: number) => MethodDecorator;

/**
 * Задаёт фазу регистрации `@Update()` listener-а.
 *
 * `fallback` регистрируется после всех listener-ов фазы `normal`. Декоратор
 * меняет только порядок регистрации и не вызывает `next()` за обработчик.
 */
export const TgListenerPhase: ListenerPhaseDecorator = (
  phase: ListenerPhase,
): MethodDecorator => {
  if (phase !== 'normal' && phase !== 'fallback') {
    throw new RangeError(`Unknown listener phase: ${String(phase)}`);
  }

  return ListenerPhaseMetadataDecorator(phase);
};

/** Alias for {@link TgListenerPhase}. */
export const ListenerPhase = TgListenerPhase;

/**
 * Задаёт порядок listener-а внутри его фазы: меньшие значения идут раньше.
 *
 * Значение по умолчанию — `0`; при одинаковом приоритете сохраняется порядок
 * discovery. Декоратор применяется к `@Update()` listener-ам.
 */
export const TgListenerPriority: ListenerPriorityDecorator = (
  priority: number,
): MethodDecorator => {
  if (!Number.isFinite(priority)) {
    throw new RangeError('Listener priority must be a finite number');
  }

  return ListenerPriorityMetadataDecorator(priority);
};

/** Alias for {@link TgListenerPriority}. */
export const ListenerPriority = TgListenerPriority;
