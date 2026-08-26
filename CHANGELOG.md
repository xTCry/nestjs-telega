# Changelog

## [1.0.0-rc.1](https://github.com/xTCry/nestjs-telega/compare/v0.1.0...v1.0.0-rc.1) (2026-08-26)

### ⚠ BREAKING CHANGES

* **core:** migrate to `telegraf-hardened`

### 🧹 Chore

* **release:** prepare hardened release workflow ([815a190](https://github.com/xTCry/nestjs-telega/commit/815a190d715fc8ab7501e103d7bae1654bb6fce0))

### 🚀 Features

* **core:** migrate to `telegraf-hardened` ([b1a794c](https://github.com/xTCry/nestjs-telega/commit/b1a794c68311fd08766fed20cce60fc660bdff84))
* **decorators:** add business and reaction parameter decorators ([a9ed48e](https://github.com/xTCry/nestjs-telega/commit/a9ed48e45e8a3fe121d0a1bf9d0db49be6bc7485))
* **hardened:** add reaction decorator and expand sample coverage ([03ea61f](https://github.com/xTCry/nestjs-telega/commit/03ea61f298818b3d8293668424d9396d0f544a92))
* **results:** support callback feedback for declarative ui actions ([f3ebc9d](https://github.com/xTCry/nestjs-telega/commit/f3ebc9da456d34d903f75e01ff8bad29c9b4b6f5))
* **results:** support declarative callback message actions ([626e9e5](https://github.com/xTCry/nestjs-telega/commit/626e9e57701c27534e061ebcf03209dc5ce51e7d))
* **results:** support declarative media message edits ([90888b8](https://github.com/xTCry/nestjs-telega/commit/90888b869e3555d69d951263ba645cc54500339c))
* **sample:** add configurable telegram business bot workflow ([528c7ac](https://github.com/xTCry/nestjs-telega/commit/528c7acf9e68420e6bfec010af7fda4013fd2280))

### 📖 Documentation

* document telegraf and hardened release lines ([515cae7](https://github.com/xTCry/nestjs-telega/commit/515cae7e2f68a725f8206d8c1bf04dfbf7ae24d7))
* **site:** add ru localization and refresh guides ([bd68e08](https://github.com/xTCry/nestjs-telega/commit/bd68e08c1c25ac0366aa1ade2d515f8a41355563))
* update telegraf release installation ([e8971dc](https://github.com/xTCry/nestjs-telega/commit/e8971dce9a8e7acc3b9b25d7c32f7436b8c7ffce))

### 🌟 Samples

* improve admin response management flow ([a891233](https://github.com/xTCry/nestjs-telega/commit/a891233f978ea0cfc11653fda63ab36f1964bb93))
* **inline:** demonstrate paginated cached inline queries ([b8eb47b](https://github.com/xTCry/nestjs-telega/commit/b8eb47bdc92443acf5e8afadd30b67f966295f5e))

## 0.1.0 (2026-08-21)

### 🧹 Chore

* **deps:** remove dependabot config ([067fce2](https://github.com/xTCry/nestjs-telega/commit/067fce2cd0a011ccd655d2f54eb64e961a70a7bc))
* **release:** add release-it workflow ([a3a9878](https://github.com/xTCry/nestjs-telega/commit/a3a9878eb44814f2cf6db800ea253bc16cf245a4))
* **release:** prepare telegraf compatibility version ([2640421](https://github.com/xTCry/nestjs-telega/commit/264042178a45bfa95184633e41359cedf04b6a91))

### 🚀 Features

* **decorators:** add `Tg`-prefixed decorator aliases ([d0e2965](https://github.com/xTCry/nestjs-telega/commit/d0e29657e8154f1c537112c361b398aeed7246d8))
* **listeners:** add extend multi-bot sample ([461781f](https://github.com/xTCry/nestjs-telega/commit/461781f704ff0d559355cd82ab48326a3d6548e3))
* **listeners:** add typed reply results and options ([5e0691d](https://github.com/xTCry/nestjs-telega/commit/5e0691d2c55b557f368585c69e66b33ad4587d38))
* **listeners:** support callback and inline results ([2fa0226](https://github.com/xTCry/nestjs-telega/commit/2fa0226352de59950ec6c0f11752dcdc6cace620))

### 🐛 Bug Fixes

* **deps:** satisfy release changelog parser peer dependency ([5f3c07c](https://github.com/xTCry/nestjs-telega/commit/5f3c07c1180733c5ae77c479da21eb1e6a88cc9c))

### 📖 Documentation

* **readme:** refresh library overview and setup guide ([397a700](https://github.com/xTCry/nestjs-telega/commit/397a700018ad18b120e4c35da11246e14dc8a629))

### ☯ Styling

* **format:** configure prettier import sorting ([4d9885d](https://github.com/xTCry/nestjs-telega/commit/4d9885d5d745a83dd2a308f8d0299c04742f3e17))

### 🔧 Code Refactoring

* **core:** isolate multi-bot providers ([7d44b30](https://github.com/xTCry/nestjs-telega/commit/7d44b304dadbfef7da313289ef4b8c70276316f7))
* **core:** modernize listener discovery and metadata ([b0e0bfd](https://github.com/xTCry/nestjs-telega/commit/b0e0bfd214437b1f133be875448096855c761bd2))
* **listeners:** isolate registration and order middleware ([6fcb6dc](https://github.com/xTCry/nestjs-telega/commit/6fcb6dc8ddcd820fcc273ba87ef38b811f06bc42))

### 🐱‍💻 Tests

* **core:** expand listener discovery coverage ([3391d22](https://github.com/xTCry/nestjs-telega/commit/3391d229c0a12dad34c09b7e9fe4a24c769210cf))
* **core:** expand multi-bot module coverage ([07834a8](https://github.com/xTCry/nestjs-telega/commit/07834a8d78aa71cd841ba6a2772bfbd147b2fd09))

### 🛠️ CI

* **docs:** deploy vitepress site to GitHub Pages ([0139728](https://github.com/xTCry/nestjs-telega/commit/013972838cf5dadad88fd6c5a5b39bb2dc079ecf))
* update supported nodejs versions ([00f2b5f](https://github.com/xTCry/nestjs-telega/commit/00f2b5ff7d96e6c98125792022e5603d8a34d946))

### 🌟 Samples

* **complete-app:** cover current telegraf integration ([53dbb97](https://github.com/xTCry/nestjs-telega/commit/53dbb9744ecde0a374e3ab6111b9d8acccc287bb))
