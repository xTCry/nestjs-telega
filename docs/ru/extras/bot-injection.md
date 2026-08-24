# Внедрение bot instance

Если provider должен напрямую вызвать методы Telegram API, внедрите нативный
экземпляр `Telegraf` с помощью `@InjectBot()`:

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

При работе с [несколькими ботами](/ru/extras/multiple-bots) обязательно
укажите имя нужного bot:

```ts
constructor(
  @InjectBot('cats') private readonly catBot: Telegraf<TelegrafContext>,
) {}
```
