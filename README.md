# binarytf <img src="https://github.com/binarytf/binarytf/blob/master/static/logo.png?raw=true" align="right" width="22%">

<div align="center">
	<p>
		<a href="https://discord.gg/pE5sfxK">
			<img src="https://discordapp.com/api/guilds/582495121698717696/embed.png" alt="Discord" />
		</a>
		<a href="https://www.npmjs.com/package/binarytf">
			<img src="https://img.shields.io/npm/v/binarytf.svg?maxAge=3600" alt="NPM version" />
		</a>
		<a href="https://www.npmjs.com/package/binarytf">
			<img src="https://img.shields.io/npm/dt/binarytf.svg?maxAge=3600" alt="NPM downloads" />
		</a>
		<a href="https://dev.azure.com/kyranet/kyranet.public/_build/latest?definitionId=12&branchName=master">
			<img src="https://dev.azure.com/kyranet/kyranet.public/_apis/build/status/kyranet.binarytf?branchName=master" alt="Build status" />
		</a>
		<a href="https://dev.azure.com/kyranet/kyranet.public/_build/latest?definitionId=12&branchName=master">
			<img src="https://img.shields.io/azure-devops/coverage/kyranet/kyranet.public/12/master.svg" alt="Azure DevOps coverage">
		</a>
		<a href="https://lgtm.com/projects/g/kyranet/binarytf/alerts/">
			<img src="https://img.shields.io/lgtm/alerts/g/kyranet/binarytf.svg?logo=lgtm&logoWidth=18" alt="Total alerts">
		</a>
		<a href="https://dependabot.com">
			<img src="https://api.dependabot.com/badges/status?host=github&repo=kyranet/binarytf" alt="Dependabot Status">
		</a>
		<a href="https://www.patreon.com/kyranet">
			<img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" />
		</a>
	</p>
	<p>
		<a href="https://nodei.co/npm/binarytf/"><img src="https://nodei.co/npm/binarytf.png?downloads=true&stars=true" alt="npm installnfo" /></a>
	</p>
</div>

## About

`Binary Term Format` is a term format inspired in ETF with more types and circular reference serialization and deserialization.
This term format is designed to fix one of ETF's flaws: byte size.

Serializing this object:

```json
{ "test": ["hello", "world"], "more": { "nested": "objects", "do": ["you", "like", "it?"] } }
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

## Credit

`binarytf` is heavily based on [`devsnek/earl`][earl], this module wouldn't be possible without it's author:

- [Gus Caplan](https://github.com/devsnek)

## Contributing

1. Fork it!
1. Create your feature branch: `git checkout -b my-new-feature`
1. Commit your changes: `git commit -am 'Add some feature'`
1. Push to the branch: `git push origin my-new-feature`
1. Submit a pull request!

## Author

**binarytf** © [kyranet](https://github.com/kyranet), released under the
[MIT](https://github.com/kyranet/binarytf/blob/master/LICENSE) License.
Authored and maintained by kyranet.

> Github [kyranet](https://github.com/kyranet) - Twitter [@kyranet_](https://twitter.com/kyranet_)

[earl]: https://github.com/devsnek/earl
