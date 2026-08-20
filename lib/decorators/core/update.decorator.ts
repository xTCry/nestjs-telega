import { Reflector } from '@nestjs/core';

/**
 * `@TgUpdate` decorator, it's like NestJS `@Controller` decorator,
 * but for Telegram Bot API updates.
 */
export const TgUpdate = Reflector.createDecorator();

/** Alias for {@link TgUpdate}. */
export const Update = TgUpdate;
