import {
  DEFAULT_BOT_NAME,
  TELEGRAF_BOT_NAME,
  TELEGRAF_LISTENERS_EXPLORER,
  TELEGRAF_MODULE_OPTIONS,
  TELEGRAF_SHUTDOWN_SERVICE,
  TELEGRAF_STAGE,
} from '../telegraf.constants';

/** Создаёт уникальный core provider token для именованного bot instance. */
function getTelegrafCoreToken(name: string | undefined, token: string): string {
  return name && name !== DEFAULT_BOT_NAME ? `${name}${token}` : token;
}

export function getTelegrafModuleOptionsToken(name?: string): string {
  return getTelegrafCoreToken(name, TELEGRAF_MODULE_OPTIONS);
}

export function getTelegrafBotNameToken(name?: string): string {
  return getTelegrafCoreToken(name, TELEGRAF_BOT_NAME);
}

export function getTelegrafStageToken(name?: string): string {
  return getTelegrafCoreToken(name, TELEGRAF_STAGE);
}

export function getTelegrafListenersExplorerToken(name?: string): string {
  return getTelegrafCoreToken(name, TELEGRAF_LISTENERS_EXPLORER);
}

export function getTelegrafShutdownServiceToken(name?: string): string {
  return getTelegrafCoreToken(name, TELEGRAF_SHUTDOWN_SERVICE);
}
