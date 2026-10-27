import type { Update } from 'telegraf-hardened/types';

import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';

/** Записанный запрос к локальному fake Bot API. */
export interface FakeTelegramCall<
  TMethod extends string = string,
  TParams extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
> {
  method: TMethod;
  params: TParams;
  result: TResult;
}

/** Совместимое имя для сценариев, использующих тип вызова fake API. */
export type FakeTelegramApiCall<
  TMethod extends string = string,
  TParams extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
> = FakeTelegramCall<TMethod, TParams, TResult>;

export interface FakeTelegramError {
  error_code: number;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface FakeTelegramUser {
  id: number;
  firstName?: string;
  username?: string;
}

export interface FakeTelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup';
  title?: string;
  first_name?: string;
  username?: string;
}

export interface FakeTelegramMessage {
  message_id: number;
  date: number;
  chat: FakeTelegramChat;
  from: { id: number; is_bot: boolean; first_name: string; username?: string };
  text?: string;
  reply_markup?: Record<string, unknown>;
}

export type FakeTelegramMethod = (params: Record<string, unknown>) => unknown;

interface Poll {
  response: ServerResponse;
  offset: number;
  timer: NodeJS.Timeout;
}

interface Waiter {
  method: string;
  predicate: (call: FakeTelegramCall) => boolean;
  resolve: (call: FakeTelegramCall) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

/** Локальный ограниченный fake API для тестирования настоящего polling. */
export class FakeTelegramApi {
  readonly calls: FakeTelegramCall[] = [];
  readonly botInfo = {
    id: 1,
    is_bot: true as const,
    first_name: 'Test bot',
    username: 'test_bot',
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
  };
  private readonly server: Server;
  private readonly updates: Update[] = [];
  private readonly polls = new Set<Poll>();
  private readonly waiters = new Set<Waiter>();
  private readonly methods = new Map<string, FakeTelegramMethod>();
  private readonly failures = new Map<string, FakeTelegramError[]>();
  private nextMessageId = 1;
  private nextUpdateId = 1;
  private readonly messages = new Map<string, FakeTelegramMessage>();
  private readonly chats = new Map<number, FakeTelegramChat>();
  private closed = false;
  url = '';

  private constructor() {
    this.server = createServer((request, response) => {
      void this.handleRequest(request, response);
    });
  }

  static async start(): Promise<FakeTelegramApi> {
    const api = new FakeTelegramApi();
    await new Promise<void>((resolve, reject) => {
      api.server.once('error', reject);
      api.server.listen(0, '127.0.0.1', () => {
        api.server.off('error', reject);
        resolve();
      });
    });
    api.url = `http://127.0.0.1:${(api.server.address() as AddressInfo).port}`;
    return api;
  }

  /** Добавляет готовый Telegram update в очередь polling. */
  pushUpdate(update: Update): void {
    if (this.closed) throw new Error('Fake Telegram API is closed');
    if (this.updates.some((item) => item.update_id === update.update_id)) {
      throw new Error(`Duplicate update_id: ${update.update_id}`);
    }
    this.updates.push(update);
    this.nextUpdateId = Math.max(this.nextUpdateId, update.update_id + 1);
    this.updates.sort((a, b) => a.update_id - b.update_id);
    this.flushPolls();
  }

  pushText(user: FakeTelegramUser, text: string): FakeTelegramMessage {
    return this.pushMessage(
      user,
      { id: user.id, type: 'private', first_name: user.firstName ?? 'Test' },
      text,
    );
  }

  pushChatText(
    user: FakeTelegramUser,
    chat: FakeTelegramChat,
    text: string,
  ): FakeTelegramMessage {
    if (chat.type === 'private')
      throw new Error('pushChatText expects group or supergroup chat');
    return this.pushMessage(user, chat, text);
  }

  pushChatTitleUpdate(
    user: FakeTelegramUser,
    chat: FakeTelegramChat,
    title: string,
  ): void {
    const updatedChat = { ...chat, title };
    this.chats.set(chat.id, updatedChat);
    const message = {
      message_id: this.nextMessageId++,
      date: 0,
      chat: updatedChat,
      from: this.user(user),
      new_chat_title: title,
    };
    this.pushUpdate({ update_id: this.nextUpdateId, message } as Update);
  }

  pushBotChatMembership(user: FakeTelegramUser, chat: FakeTelegramChat): void {
    this.chats.set(chat.id, chat);
    this.pushUpdate({
      update_id: this.nextUpdateId,
      my_chat_member: {
        chat,
        from: this.user(user),
        date: 0,
        old_chat_member: { user: this.botInfo, status: 'left' },
        new_chat_member: { user: this.botInfo, status: 'member' },
      },
    } as Update);
  }

  pushCallback(
    user: FakeTelegramUser,
    data: string,
    message: FakeTelegramMessage,
  ): string {
    const id = `test-callback-${this.nextUpdateId}`;
    this.pushUpdate({
      update_id: this.nextUpdateId,
      callback_query: {
        id,
        from: this.user(user),
        message,
        chat_instance: `test-${message.chat.id}`,
        data,
      },
    } as Update);
    return id;
  }

  getMessageWithCallback(data: string): FakeTelegramMessage | undefined {
    return [...this.messages.values()].find((message) => {
      const keyboard = message.reply_markup?.inline_keyboard;
      return (
        Array.isArray(keyboard) &&
        keyboard.some(
          (row: unknown) =>
            Array.isArray(row) &&
            row.some(
              (button: unknown) =>
                typeof button === 'object' &&
                button !== null &&
                'callback_data' in button &&
                button.callback_data === data,
            ),
        )
      );
    });
  }

  private user(user: FakeTelegramUser): FakeTelegramMessage['from'] {
    return {
      id: user.id,
      is_bot: false,
      first_name: user.firstName ?? 'Test',
      ...(user.username ? { username: user.username } : {}),
    };
  }

  private pushMessage(
    user: FakeTelegramUser,
    chat: FakeTelegramChat,
    text: string,
  ): FakeTelegramMessage {
    this.chats.set(chat.id, chat);
    const command = text.match(/^\/[^\s@]+(?:@\w+)?/)?.[0];
    const message = {
      message_id: this.nextMessageId++,
      date: 0,
      chat,
      from: this.user(user),
      text,
      ...(command
        ? {
            entities: [
              {
                offset: 0,
                length: command.length,
                type: 'bot_command' as const,
              },
            ],
          }
        : {}),
    };
    this.pushUpdate({ update_id: this.nextUpdateId, message } as Update);
    return message;
  }

  /** Переопределяет результат метода или добавляет собственный метод. */
  onMethod(method: string, handler: FakeTelegramMethod): void {
    this.methods.set(method, handler);
  }

  failNext(method: string, error: FakeTelegramError): void {
    const failures = this.failures.get(method) ?? [];
    failures.push(error);
    this.failures.set(method, failures);
  }

  /** Ожидает записанный вызов; after позволяет исключить старые вызовы. */
  waitForCall<TCall extends FakeTelegramCall = FakeTelegramCall>(
    method: TCall['method'],
    predicate: (call: TCall) => boolean = () => true,
    timeoutMs = 5000,
  ): Promise<TCall> {
    return this.waitForNextCall(0, method, predicate, timeoutMs);
  }

  waitForPolling(timeoutMs = 5000): Promise<FakeTelegramCall> {
    return this.waitForCall('getUpdates', () => true, timeoutMs);
  }

  waitForNextCall<TCall extends FakeTelegramCall = FakeTelegramCall>(
    after: number,
    method: TCall['method'],
    predicate: (call: TCall) => boolean = () => true,
    timeoutMs = 5000,
  ): Promise<TCall> {
    if (this.closed)
      return Promise.reject(new Error('Fake Telegram API is closed'));
    const existing = this.calls
      .slice(after)
      .find((call) => call.method === method && predicate(call as TCall));
    if (existing) return Promise.resolve(existing as TCall);
    return new Promise((resolve, reject) => {
      const waiter: Waiter = {
        method,
        predicate: (call) =>
          this.calls.indexOf(call) >= after && predicate(call as TCall),
        resolve: (call) => resolve(call as TCall),
        reject,
        timer: setTimeout(() => {
          this.waiters.delete(waiter);
          reject(new Error(`Timed out waiting for Telegram ${method}`));
        }, timeoutMs),
      };
      this.waiters.add(waiter);
    });
  }

  /** Сбрасывает вызовы, update-ы и ошибки, сохраняя обработчики и polling. */
  reset(): void {
    this.calls.length = 0;
    this.updates.length = 0;
    this.failures.clear();
    this.messages.clear();
    this.chats.clear();
    this.nextMessageId = 1;
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    for (const poll of this.polls) {
      clearTimeout(poll.timer);
      poll.response.destroy();
    }
    this.polls.clear();
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error('Fake Telegram API is closed'));
    }
    this.waiters.clear();
    this.server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      this.server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  private record(call: FakeTelegramCall): void {
    this.calls.push(call);
    for (const waiter of this.waiters) {
      if (waiter.method === call.method && waiter.predicate(call)) {
        clearTimeout(waiter.timer);
        this.waiters.delete(waiter);
        waiter.resolve(call);
      }
    }
  }

  private async handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const method = request.url?.match(/^\/bot[^/]+\/([^/?]+)/)?.[1];
    if (!method || request.method !== 'POST') {
      this.send(
        response,
        { ok: false, error_code: 404, description: 'Unknown route' },
        404,
      );
      return;
    }
    try {
      let body = '';
      for await (const chunk of request) body += String(chunk);
      const params = body ? (JSON.parse(body) as Record<string, unknown>) : {};
      const failure = this.failures.get(method)?.shift();
      if (failure) {
        this.record({ method, params, result: failure });
        this.send(response, { ok: false, ...failure });
        return;
      }
      if (method === 'getUpdates') {
        this.record({ method, params, result: undefined });
        const offset = Number(params.offset) || 0;
        // Telegram подтверждает update-ы только следующим запросом с offset.
        while (this.updates[0] && this.updates[0].update_id < offset)
          this.updates.shift();
        const poll: Poll = {
          response,
          offset,
          timer: setTimeout(
            () => this.finishPoll(poll, []),
            Math.max(
              100,
              Math.min(Number(params.timeout) * 1000 || 1000, 30000),
            ),
          ),
        };
        this.polls.add(poll);
        response.once('close', () => this.removePoll(poll));
        this.flushPolls();
        return;
      }
      const custom = this.methods.get(method);
      const result = custom
        ? await custom(params)
        : this.defaultResult(method, params);
      this.record({ method, params, result });
      this.send(response, { ok: true, result });
    } catch (error) {
      this.send(
        response,
        {
          ok: false,
          error_code: 500,
          description:
            error instanceof Error ? error.message : 'Fake API error',
        },
        500,
      );
    }
  }

  private defaultResult(
    method: string,
    params: Record<string, unknown>,
  ): unknown {
    if (method === 'getMe') return this.botInfo;
    if (
      method === 'sendMessage' ||
      method === 'editMessageText' ||
      method === 'editMessageReplyMarkup'
    ) {
      const key = `${String(params.chat_id)}:${String(params.message_id)}`;
      const previous = this.messages.get(key);
      const message = {
        ...previous,
        message_id: Number(params.message_id) || this.nextMessageId++,
        date: 0,
        chat: this.chats.get(Number(params.chat_id)) ?? {
          id: Number(params.chat_id),
          type: 'private',
          first_name: 'Test',
        },
        from: this.botInfo,
        ...(typeof params.text === 'string' ? { text: params.text } : {}),
        ...(params.reply_markup && typeof params.reply_markup === 'object'
          ? { reply_markup: params.reply_markup as Record<string, unknown> }
          : {}),
      };
      this.messages.set(
        `${message.chat.id}:${message.message_id}`,
        message as FakeTelegramMessage,
      );
      return message;
    }
    if (
      [
        'deleteWebhook',
        'setWebhook',
        'answerCallbackQuery',
        'deleteMessage',
      ].includes(method)
    )
      return true;
    throw new Error(`Unsupported fake Telegram method: ${method}`);
  }

  private flushPolls(): void {
    for (const poll of this.polls) {
      const updates = this.updates.filter(
        (update) => update.update_id >= poll.offset,
      );
      if (updates.length) this.finishPoll(poll, updates);
    }
  }

  private finishPoll(poll: Poll, updates: Update[]): void {
    this.removePoll(poll);
    if (!poll.response.destroyed)
      this.send(poll.response, { ok: true, result: updates });
  }

  private removePoll(poll: Poll): void {
    clearTimeout(poll.timer);
    this.polls.delete(poll);
  }

  private send(response: ServerResponse, body: unknown, status = 200): void {
    if (response.destroyed || response.writableEnded) return;
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  }
}
