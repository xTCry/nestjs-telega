import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafException, TelegrafExecutionContext } from 'nestjs-telega';

import { Context } from '../../interfaces/context.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly ADMIN_IDS = [];

  canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const { from } = ctx.getContext<Context>();

    const isAdmin = this.ADMIN_IDS.includes(from.id);
    if (!isAdmin) {
      throw new TelegrafException('You are not admin 😡');
    }

    return true;
  }
}
