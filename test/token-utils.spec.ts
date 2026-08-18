import { DEFAULT_BOT_NAME, TELEGRAF_ALL_BOTS } from '../lib/telegraf.constants';
import { getAllBotsToken, getBotToken } from '../lib/utils';

describe('bot token utilities', () => {
  it('returns the default token when bot name is omitted', () => {
    expect(getBotToken()).toBe(DEFAULT_BOT_NAME);
  });

  it('returns the default token for the explicit default name', () => {
    expect(getBotToken(DEFAULT_BOT_NAME)).toBe(DEFAULT_BOT_NAME);
  });

  it('creates an isolated token for a named bot', () => {
    expect(getBotToken('reminder')).toBe('reminderBot');
  });

  it('returns the token for the all-bots registry', () => {
    expect(getAllBotsToken()).toBe(TELEGRAF_ALL_BOTS);
  });
});
