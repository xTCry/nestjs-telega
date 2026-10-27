import type { IncomingMessage } from 'node:http';
import { parse as parseQuery } from 'node:querystring';

/** Читает поля Bot API; содержимое загруженных файлов намеренно не сохраняется. */
export async function readTelegramParams(
  request: IncomingMessage,
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const body = Buffer.concat(chunks).toString('utf8');
  if (!body) return {};
  const contentType = request.headers['content-type'] ?? '';
  if (contentType.includes('application/json'))
    return JSON.parse(body) as Record<string, unknown>;
  let params: Record<string, unknown>;
  if (contentType.includes('application/x-www-form-urlencoded')) {
    params = parseQuery(body);
  } else if (contentType.includes('multipart/form-data')) {
    const boundary = /boundary=(?:"([^"]+)"|([^;\s]+))/.exec(contentType);
    const value = boundary?.[1] ?? boundary?.[2];
    if (!value) throw new Error('Multipart boundary is missing');
    params = {};
    for (const part of body.split(`--${value}`)) {
      const separator = part.indexOf('\r\n\r\n');
      if (separator < 0) continue;
      const headers = part.slice(0, separator);
      const name = /(?:^|;)\s*name="([^"]+)"/i.exec(headers)?.[1];
      if (!name || /(?:^|;)\s*filename=/i.test(headers)) continue;
      params[name] = part.slice(separator + 4).replace(/\r\n$/, '');
    }
  } else {
    throw new Error(`Unsupported content type: ${contentType || 'unknown'}`);
  }
  for (const key of [
    'allowed_updates',
    'commands',
    'link_preview_options',
    'reply_markup',
    'reply_parameters',
    'scope',
  ]) {
    const value = params[key];
    if (typeof value !== 'string') continue;
    try {
      params[key] = JSON.parse(value) as unknown;
    } catch {
      /* Невалидное значение остаётся строкой. */
    }
  }
  return params;
}
