# Installation

> This documentation follows the next default line, based on
> [telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened).
> It requires Node.js 18 or newer and will be published as npm `latest` with
> the first stable `1.0.0` release. The stable
> [Telegraf](https://github.com/telegraf/telegraf)-based line is maintained in
> the [telegraf branch](https://github.com/xTCry/nestjs-telega/tree/telegraf)
> and must be installed with the `@telegraf` tag.

## Next default line

```bash
$ npm i nestjs-telega telegraf-hardened
```

## Stable Telegraf line

```bash
$ npm i nestjs-telega@telegraf telegraf
```

Once the installation process is complete, we can import the `TelegrafModule` into the root `AppModule`.

```typescript title="src/app.module.ts"
import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telega';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: 'TELEGRAM_BOT_TOKEN',
    })
  ],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as the
[`Telegraf` constructor](https://github.com/telegraf-hardened/telegraf-hardened)
from `telegraf-hardened`.
