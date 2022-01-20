<div align="center">
  <p>
  <img src="https://github.com/binarytf/binarytf/blob/main/static/logo.png?raw=true" width="22%" alt="logo"/>
  </p>
  <p>
<h1> BinaryTF </h1>
  </p>
</div>

[![Discord](https://discordapp.com/api/guilds/582495121698717696/embed.png)](https://discord.gg/pE5sfxK)
[![Twitter Follow](https://img.shields.io/twitter/follow/kyranet_?label=Follow%20@kyranet_&logo=twitter&colorB=1DA1F2&style=flat-square)](https://twitter.com/kyranet_/follow)
[![Patreon Donate](https://img.shields.io/badge/patreon-donate-brightgreen.svg?label=Donate%20with%20Patreon&logo=patreon&colorB=F96854&style=flat-square&link=https://donate.skyra.pw/patreon)](https://donate.skyra.pw/patreon)
[![PayPal Donate](https://img.shields.io/badge/paypal-donate-brightgreen.svg?label=Donate%20with%20Paypal&logo=paypal&colorB=00457C&style=flat-square&link=https://donate.skyra.pw/paypal)](https://donate.skyra.pw/paypal)

[![GitHub](https://img.shields.io/github/license/binarytf/binarytf?logo=github&style=flat-square)](https://github.com/binarytf/binarytf/blob/main/LICENSE.md)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/binarytf/binarytf.svg?logo=lgtm&logoWidth=18&style=flat-square)](https://lgtm.com/projects/g/binarytf/binarytf/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/binarytf/binarytf.svg?logo=lgtm&logoWidth=18&style=flat-square)](https://lgtm.com/projects/g/binarytf/binarytf/context:javascript)
[![Coverage Status](https://coveralls.io/repos/github/binarytf/binarytf/badge.svg?branch=main&style=flat-square)](https://coveralls.io/github/binarytf/binarytf?branch=main)

[![npm](https://img.shields.io/npm/v/binarytf?color=crimson&logo=npm&style=flat-square)](https://www.npmjs.com/package/binarytf)
[![npm](https://img.shields.io/npm/dt/binarytf?style=flat-square)](https://www.npmjs.com/package/binarytf)
[![npm bundle size](https://img.shields.io/bundlephobia/min/binarytf?style=flat-square)](https://bundlephobia.com/result?p=binarytf)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/binarytf?style=flat-square)](https://bundlephobia.com/result?p=binarytf)

---

## About

`Binary Term Format` is a term format inspired in ETF with more types and circular reference serialization and deserialization.
This term format is designed to fix one of ETF's flaws: byte size.

Serializing this object:

```json
{
	"test": ["hello", "world"],
	"more": {
		"nested": "objects",
		"do": ["you", "like", "it?"]
	}
}
```

Takes `80` bytes as `JSON.stringify()`'d, `116` bytes as `ETF` using [`devsnek/earl`][earl], and just `71` bytes in `BTF`.

The extreme compression is achieved by delimiting the bytes using a technique similar to [null delimited string](https://en.wikipedia.org/wiki/Null-terminated_string)s. Allowing every string, array, set, map, and object, to trim the byte size by 3 (4 bytes for length/size -> 1 byte to delimit the field). TypedArrays do not get this feature, since they have a type for all elements instead of a type for each element, `[0]` works because it is encoded as `ArrayType` + `NumberByteLiteralType` + `0x00` + `NullDelimiter`, but this technique would not work in `Uint8Array[0]` (`Uint8ArrayType` + `0x00 + 0x00 + 0x00 + 0x01` + `0x00`).

And this is also achieved by using special types for empty collections, `[null]` takes 3 bytes (`ArrayType` + `NullType` + `NullDelimiter`), but `[]` takes a single byte (`EmptyArrayType`). This also applies to empty objects, sets, and maps.

## Usage

This module is [plug-and-play](https://en.wikipedia.org/wiki/Plug_and_play), it exposes two functions, `serialize` and `deserialize`, and would be used in the following way:

```javascript
const { serialize, deserialize } = require('binarytf');

const serialized = serialize({ hello: 'world' });
const deserialized = deserialize(serialized);
console.log(deserialized); // { hello: 'world' }
```

This module is TypeScript ready and comes with types included. To import with ESM use the following syntax:

```typescript
import { serialize, deserialize } from 'binarytf';
```

## Credit

`binarytf` is heavily based on [`devsnek/earl`][earl], this module wouldn't be possible without it's author:

-   [Gus Caplan](https://github.com/devsnek)

## Contributing

1. Fork it!
1. Create your feature branch: `git checkout -b my-new-feature`
1. Commit your changes: `git commit -am 'Add some feature'`
1. Push to the branch: `git push origin my-new-feature`
1. Submit a pull request!

## Author

**binarytf** © [kyranet](https://github.com/kyranet), released under the
[MIT](https://github.com/binarytf/binarytf/blob/main/LICENSE.md) License.
Authored and maintained by kyranet.

> Github [kyranet](https://github.com/kyranet) - Twitter [@kyranet\_](https://twitter.com/kyranet_)

[earl]: https://github.com/devsnek/earl

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/kyranet"><img src="https://avatars0.githubusercontent.com/u/24852502?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Antonio Román</b></sub></a><br /><a href="https://github.com/binarytf/binarytf/commits?author=kyranet" title="Code">💻</a> <a href="#example-kyranet" title="Examples">💡</a> <a href="#ideas-kyranet" title="Ideas, Planning, & Feedback">🤔</a> <a href="#projectManagement-kyranet" title="Project Management">📆</a> <a href="https://github.com/binarytf/binarytf/pulls?q=is%3Apr+reviewed-by%3Akyranet" title="Reviewed Pull Requests">👀</a> <a href="#question-kyranet" title="Answering Questions">💬</a> <a href="https://github.com/binarytf/binarytf/commits?author=kyranet" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/vladfrangu"><img src="https://avatars3.githubusercontent.com/u/17960496?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vlad Frangu</b></sub></a><br /><a href="https://github.com/binarytf/binarytf/issues?q=author%3Avladfrangu" title="Bug reports">🐛</a> <a href="https://github.com/binarytf/binarytf/commits?author=vladfrangu" title="Code">💻</a></td>
    <td align="center"><a href="https://favware.tech/"><img src="https://avatars3.githubusercontent.com/u/4019718?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jeroen Claassens</b></sub></a><br /><a href="https://github.com/binarytf/binarytf/commits?author=favna" title="Code">💻</a> <a href="https://github.com/binarytf/binarytf/commits?author=favna" title="Tests">⚠️</a> <a href="#platform-favna" title="Packaging/porting to new platform">📦</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
