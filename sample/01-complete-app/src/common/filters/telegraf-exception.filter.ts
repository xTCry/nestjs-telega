import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telega';

import { Context } from '../../interfaces/context.interface';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegrafExceptionFilter.name);

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const executionContext = host as ExecutionContext;
    const className = executionContext.getClass()?.name ?? 'UnknownClass';
    const handlerName = executionContext.getHandler()?.name ?? 'unknownHandler';
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<Context>();

    this.logger.error(
      `Caught ${className}.${handlerName} (type: ${host.getType()})`,
      exception.stack,
    );

    await ctx.replyWithHTML(
      [
        '<b>Exception filter check</b>',
        `host.getType(): <code>${escapeHtml(host.getType())}</code>`,
        `host.getClass(): <code>${escapeHtml(className)}</code>`,
        `host.getHandler(): <code>${escapeHtml(handlerName)}</code>`,
        '',
        `<b>Error</b>: ${escapeHtml(exception.message)}`,
      ].join('\n'),
    );
  }
}

/** Экранирует текст, который будет отправлен с parse_mode: HTML. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
    };

    return entities[character];
  });
}
