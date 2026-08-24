# Bot injection
Inject the native `Telegraf` instance with `@InjectBot()` when a provider needs
Telegram API methods directly:

```ts title="src/echo/echo.service.ts"
import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telega';
import { Telegraf } from 'telegraf-hardened';

import type { TelegrafContext } from '../common/interfaces/telegraf-context.interface';

@Injectable()
export class EchoService {
  constructor(@InjectBot() private readonly bot: Telegraf<TelegrafContext>) {}
}
```

If you run [multiple bots](/extras/multiple-bots), explicitly specify the bot
name:

```ts title="src/echo/echo.service.ts"
import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telega';
import { Telegraf } from 'telegraf-hardened';

import type { TelegrafContext } from '../common/interfaces/telegraf-context.interface';

@Injectable()
export class EchoService {
  constructor(
    @InjectBot('cats') private readonly catBot: Telegraf<TelegrafContext>,
  ) {}
}
```
