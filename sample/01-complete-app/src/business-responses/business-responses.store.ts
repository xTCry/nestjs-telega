import { Injectable } from '@nestjs/common';

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  BUSINESS_RESPONSE_CATEGORIES,
  BusinessReactionEmoji,
  BusinessResponseCategory,
  BusinessResponsesConfig,
  DEFAULT_BUSINESS_RESPONSES,
} from './business-responses.types';

const reactionEmojis = new Set<BusinessReactionEmoji>([
  '❤',
  '👍',
  '🔥',
  '🥰',
  '👏',
  '😁',
  '🤔',
  '🎉',
]);

const cloneConfig = (
  config: BusinessResponsesConfig,
): BusinessResponsesConfig => ({
  enabled: config.enabled,
  textReplies: [...config.textReplies],
  stickerReplies: [...config.stickerReplies],
  reactionReplies: [...config.reactionReplies],
});

const isResponseCategory = (value: string): value is BusinessResponseCategory =>
  BUSINESS_RESPONSE_CATEGORIES.includes(value as BusinessResponseCategory);

export const isReactionEmoji = (
  value: string,
): value is BusinessReactionEmoji =>
  reactionEmojis.has(value as BusinessReactionEmoji);

/**
 * Небольшое файловое хранилище: JSON подходит для локального sample и не
 * добавляет зависимости. В production его стоит заменить внешним storage.
 */
@Injectable()
export class BusinessResponsesStore {
  private readonly filePath = resolve(
    process.env.BUSINESS_RESPONSES_FILE ??
      resolve(__dirname, '../data/business-responses.json'),
  );

  private config?: BusinessResponsesConfig;

  async getConfig(): Promise<BusinessResponsesConfig> {
    await this.ensureLoaded();
    return cloneConfig(this.config!);
  }

  async setEnabled(enabled: boolean): Promise<BusinessResponsesConfig> {
    await this.ensureLoaded();
    this.config!.enabled = enabled;
    await this.persist();
    return this.getConfig();
  }

  async add(
    category: BusinessResponseCategory,
    value: string,
  ): Promise<BusinessResponsesConfig> {
    await this.ensureLoaded();
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      throw new Error('Response value cannot be empty.');
    }

    const responses = this.getResponses(category);
    if (category === 'reaction' && !isReactionEmoji(normalizedValue)) {
      throw new Error(
        `Reaction must be one of: ${[...reactionEmojis].join(' ')}.`,
      );
    }
    if (responses.includes(normalizedValue)) {
      throw new Error('This response is already configured.');
    }

    responses.push(normalizedValue);
    await this.persist();
    return this.getConfig();
  }

  async remove(
    category: BusinessResponseCategory,
    index: number,
  ): Promise<BusinessResponsesConfig> {
    await this.ensureLoaded();
    const responses = this.getResponses(category);
    if (!Number.isInteger(index) || index < 0 || index >= responses.length) {
      throw new Error('Response index is out of range.');
    }

    responses.splice(index, 1);
    await this.persist();
    return this.getConfig();
  }

  async pick(category: BusinessResponseCategory): Promise<string | undefined> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return undefined;
    }

    const replies = this.getResponsesFromConfig(config, category);
    return replies[Math.floor(Math.random() * replies.length)];
  }

  private async ensureLoaded(): Promise<void> {
    if (this.config) {
      return;
    }

    try {
      const source = await readFile(this.filePath, 'utf8');
      this.config = this.parseConfig(JSON.parse(source) as unknown);
    } catch (error) {
      if (this.isMissingFile(error)) {
        this.config = cloneConfig(DEFAULT_BUSINESS_RESPONSES);
        return;
      }
      throw error;
    }
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(
      temporaryPath,
      `${JSON.stringify(this.config, null, 2)}\n`,
      'utf8',
    );
    await rename(temporaryPath, this.filePath);
  }

  private parseConfig(value: unknown): BusinessResponsesConfig {
    if (!value || typeof value !== 'object') {
      throw new Error('Business responses JSON must contain an object.');
    }

    const source = value as Partial<BusinessResponsesConfig>;
    return {
      enabled: source.enabled ?? DEFAULT_BUSINESS_RESPONSES.enabled,
      textReplies: this.parseStringArray(source.textReplies),
      stickerReplies: this.parseStringArray(source.stickerReplies),
      reactionReplies: this.parseStringArray(source.reactionReplies).filter(
        isReactionEmoji,
      ),
    };
  }

  private parseStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private getResponses(category: BusinessResponseCategory): string[] {
    return this.getResponsesFromConfig(this.config!, category);
  }

  private getResponsesFromConfig(
    config: BusinessResponsesConfig,
    category: BusinessResponseCategory,
  ): string[] {
    switch (category) {
      case 'text':
        return config.textReplies;
      case 'sticker':
        return config.stickerReplies;
      case 'reaction':
        return config.reactionReplies;
    }
  }

  private isMissingFile(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}

export { isResponseCategory };
