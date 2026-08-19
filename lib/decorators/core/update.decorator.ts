import { Reflector } from '@nestjs/core';

/**
 * `@Update` decorator, it's like NestJS `@Controller` decorator,
 * but for Telegram Bot API updates.
 */
export const Update = Reflector.createDecorator();
