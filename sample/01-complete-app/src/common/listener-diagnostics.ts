import { Logger } from '@nestjs/common';
import type { ListenerRegistrationDescriptor } from 'nestjs-telega';

const logger = new Logger('ListenerDiagnostics');

/** Выводит безопасный порядок регистрации listener-ов при старте sample. */
export const logListenerRegistration = (
  listener: ListenerRegistrationDescriptor,
): void => {
  logger.log(
    `#${listener.registrationIndex} phase=${listener.phase} ` +
      `priority=${listener.priority} ${listener.moduleName}.` +
      `${listener.providerName}.${listener.methodName} -> ` +
      `${listener.listenerMethod}(${formatListenerArgs(listener.args)})`,
  );
};

/** Сериализует decorator arguments без доступа к update или bot instance. */
function formatListenerArgs(args: readonly unknown[]): string {
  return args
    .map((arg) => {
      if (arg instanceof RegExp) {
        return arg.toString();
      }

      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(', ');
}
