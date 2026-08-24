import { Reflector } from '@nestjs/core';

/**
 * `@TgUpdate` decorator, it's like NestJS `@Controller` decorator,
 * but for Telegram Bot API updates.
 *
 * Тип `@Ctx()` параметра по умолчанию: {@link import('telegraf-hardened').Context}.
 * Для конкретного listener-а используйте тип, указанный в его JSDoc.
 */
export const TgUpdate = Reflector.createDecorator();

/** Alias for {@link TgUpdate}. */
export const Update = TgUpdate;
