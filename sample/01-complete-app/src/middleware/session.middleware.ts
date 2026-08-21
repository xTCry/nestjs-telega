import { session } from 'telegraf-hardened';

export const sessionMiddleware: ReturnType<typeof session> = session();
