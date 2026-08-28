/** Фаза регистрации update-listener-а в Telegraf middleware chain. */
export type ListenerRegistrationPhase = 'normal' | 'fallback';

/**
 * Безопасное описание фактически зарегистрированного update-listener-а.
 *
 * Не содержит Telegram update, bot token или callback middleware, поэтому
 * может передаваться в пользовательскую diagnostics-функцию.
 */
export interface ListenerRegistrationDescriptor {
  /** Имя NestJS module, в котором provider был найден. */
  readonly moduleName: string;
  /** Имя класса provider-а с listener-ом. */
  readonly providerName: string;
  /** Имя декорированного метода provider-а. */
  readonly methodName: string;
  /** Метод `telegraf-hardened` Composer, выбранный listener-декоратором. */
  readonly listenerMethod: string;
  /** Аргументы listener-декоратора без внутреннего callback. */
  readonly args: readonly unknown[];
  /** Фаза регистрации listener-а. */
  readonly phase: ListenerRegistrationPhase;
  /** Приоритет внутри фазы: меньшие значения регистрируются раньше. */
  readonly priority: number;
  /** Позиция listener-а в исходном discovery-порядке. */
  readonly discoveryIndex: number;
  /** Позиция listener-а в отсортированном порядке регистрации. */
  readonly registrationIndex: number;
}

/** Опциональная диагностика порядка фактической регистрации update-listener-ов. */
export interface TelegrafListenerDiagnostics {
  onRegistered(listener: ListenerRegistrationDescriptor): void;
}
