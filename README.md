# binarytf

`Binary Term Format` is a term format inspired in ETF with more types and circular reference serialization and deserialization.

[![npm](https://nodei.co/npm/binarytf.png?downloads=true&stars=true)](https://nodei.co/npm/binarytf/)

[![npm](https://img.shields.io/npm/v/binarytf.svg?maxAge=3600)](https://www.npmjs.com/package/binarytf)
[![npm](https://img.shields.io/npm/dt/binarytf.svg?maxAge=3600)](https://www.npmjs.com/package/binarytf)

[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/kyranet/binarytf.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/kyranet/binarytf/context:javascript)

[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=kyranet/binarytf)](https://dependabot.com)

## Usage

This module is meant to be plug-and-play, it exposes two functions, `serialize` and `deserialize`, and would be used in the following way:

```javascript
const { serialize, deserialize } = require('binarytf');

const serialized = serialize({ hello: 'world' });
const deserialized = deserialize(serialized);
console.log(deserialized); // { hello: 'world' }
```

## Credit

`binarytf` is heavily based on [`devsnek/earl`](https://github.com/devsnek/earl), this module wouldn't be possible without it's author:

- [Gus Caplan](https://github.com/devsnek)

## License

Licensed under MIT

Copyright (c) 2019 [kyranet](https://github.com/kyranet)
