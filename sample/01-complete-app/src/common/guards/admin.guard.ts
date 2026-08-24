import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafException, TelegrafExecutionContext } from 'nestjs-telega';

import { Context } from '../../interfaces/context.interface';

const getAdminIds = (): number[] =>
  (process.env.ADMIN_IDS ?? '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isSafeInteger(value));

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminIds = getAdminIds();

  canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const { from } = ctx.getContext<Context>();

    const isAdmin = Boolean(from && this.adminIds.includes(from.id));
    if (!isAdmin) {
      throw new TelegrafException('You are not admin 😡');
    }

    return true;
  }
}
