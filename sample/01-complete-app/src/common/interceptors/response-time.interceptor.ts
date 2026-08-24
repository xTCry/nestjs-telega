import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { TelegrafContextType, TelegrafExecutionContext } from 'nestjs-telega';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType<TelegrafContextType>() !== 'telegraf') {
      return next.handle();
    }

    const eCtx = TelegrafExecutionContext.create(context);
    const ctx = eCtx.getContext();
    console.log('Before...', ctx.update.update_id);

    const start = Date.now();
    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(
            `Response time: ${Date.now() - start}ms`,
            ctx.update.update_id,
          ),
        ),
      );
  }
}
