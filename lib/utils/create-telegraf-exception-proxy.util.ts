import { ArgumentsHost, Type } from '@nestjs/common';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';

import {
  TelegrafArgumentsHost,
  TelegrafContextType,
} from '../execution-context';

type TelegrafHandler = (...args: any[]) => unknown;

interface ExternalExceptionsHandler {
  next(exception: unknown, host: ArgumentsHost): unknown;
}

interface ExternalFiltersContextCreator {
  create(
    instance: object,
    callback: TelegrafHandler,
    moduleKey: string,
  ): ExternalExceptionsHandler;
}

interface ExternalContextCreatorWithFilters {
  filtersContextCreator: ExternalFiltersContextCreator;
}

/**
 * Создаёт обработчик исключений с исходными class и handler в ArgumentsHost.
 *
 * В NestJS ExternalErrorProxy создаёт ExecutionContextHost только с args,
 * поэтому getClass() и getHandler() в external transport-ах возвращают null.
 */
export function createTelegrafExceptionProxy(
  externalContextCreator: ExternalContextCreator,
  instance: object,
  handler: TelegrafHandler,
  targetCallback: TelegrafHandler,
): TelegrafHandler {
  // NestJS пока не предоставляет публичный доступ к этому context creator.
  // Изолируем обращение к внутреннему API в одном месте.
  const { filtersContextCreator } =
    externalContextCreator as unknown as ExternalContextCreatorWithFilters;
  const constructorRef = instance.constructor as Type<object>;
  const moduleKey = externalContextCreator.getContextModuleKey(constructorRef);
  const exceptionsHandler = filtersContextCreator.create(
    instance,
    handler,
    moduleKey,
  );

  return async (...args: any[]): Promise<unknown> => {
    try {
      return await targetCallback(...args);
    } catch (exception: unknown) {
      const host = new TelegrafArgumentsHost(args, constructorRef, handler);
      host.setType<TelegrafContextType>('telegraf');
      return exceptionsHandler.next(exception, host);
    }
  };
}
