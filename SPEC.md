# Specification

## Table of Contents

| Name                | Value |
| :-----------------: | :---: |
| `NullPointer`       | `0`   |
| `Hole`              | `1`   |
| `Null`              | `2`   |
| `PBigInt`           | `3`   |
| `NBigInt`           | `4`   |
| `Boolean`           | `5`   |
| `String`            | `6`   |
| `Undefined`         | `7`   |
| `PByte`             | `8`   |
| `NByte`             | `9`   |
| `PInt32`            | `10`  |
| `NInt32`            | `11`  |
| `PFloat64`          | `12`  |
| `NFloat64`          | `13`  |
| `Array`             | `14`  |
| `EmptyArray`        | `15`  |
| `ObjectReference`   | `16`  |
| `Date`              | `17`  |
| `BooleanObject`     | `18`  |
| `NumberObject`      | `19`  |
| `StringObject`      | `20`  |
| `EmptyObject`       | `21`  |
| `Object`            | `22`  |
| `RegExp`            | `23`  |
| `Map`               | `24`  |
| `EmptyMap`          | `25`  |
| `WeakMap`           | `26`  |
| `Set`               | `27`  |
| `EmptySet`          | `28`  |
| `WeakSet`           | `29`  |
| `ArrayBuffer`       | `30`  |
| `Int8Array`         | `31`  |
| `Uint8Array`        | `32`  |
| `Uint8ClampedArray` | `33`  |
| `Int16Array`        | `34`  |
| `Uint16Array`       | `35`  |
| `Int32Array`        | `36`  |
| `Uint32Array`       | `37`  |
| `Float32Array`      | `38`  |
| `Float64Array`      | `39`  |
| `DataView`          | `40`  |

## NullPointer

| 1    |
| :--: |
| `0`  |

A magic token that delimits untyped arrays and strings.

## Hole

| 1    |
| :--: |
| `1`  |

This token may be present **only** in `Array`s, and mean a non-set value.

## Null

| 1    |
| :--: |
| `2`  |

A [Null][] pointer.

## PBigInt

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `3`  | Length | Digit  |

A [positive arbitrary-precision BigInteger][PBigInt], they are stored in unary form. The digits are stored with the
least significant byte stored first.

## NBigInt

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `4`  | Length | Digit  |

A [negative arbitrary-precision BigInteger][NBigInt], they are stored in unary form. The digits are stored with the
least significant byte stored first.

## Boolean

| 1    | 1     |
| :--: | :---: |
| `5`  | Value |

A [Boolean][] primitive value, being `0x00` for false and `0x01` for true.

## String

| 1    |      | 1    |
| :--: | :--: | :--: |
| `6`  | Char | Tail |

A [String][] primitive value composed as many UTF8 characters until it finds an ending `NullPointer` (`0x00` or `\0`)
tail.

During the serialization progress, the `null` character (`\0` in most languages) is forbidden.

## Undefined

| 1    |
| :--: |
| `7`  |

An [Undefined][] value. Can translated as `null` for other languages.

## PByte

| 1    | 1    |
| :--: | :--: |
| `8`  | Byte |

A [positive byte][PByte].

## NByte

| 1    | 1    |
| :--: | :--: |
| `9`  | Byte |

A [negative byte][NByte].

## PInt32

| 1    | 4     |
| :--: | :---: |
| `10` | Bytes |

A [positive 32-bit integer][PInt32].

## NInt32

| 1    | 4     |
| :--: | :---: |
| `11` | Bytes |

A [negative 32-bit integer][NInt32].

## PFloat64

| 1    | 8     |
| :--: | :---: |
| `12` | Bytes |

A [positive IEEE 754][PFloat64] 64-bit float.

## NFloat64

| 1    | 8     |
| :--: | :---: |
| `13` | Bytes |

A [negative IEEE 754][NFloat64] 64-bit float.

## Array

| 1    |          | 1    |
| :--: | :------: | :--: |
| `14` | Elements | Tail |

An untyped [Array][] of as many values until it finds an ending `NullPointer` (`0x00`) tail.

## EmptyArray

| 1    |
| :--: |
| `15` |

An empty untyped [Array][].

## ObjectReference

| 1    | 4             |
| :--: | :-----------: |
| `16` | Local Pointer |

An [Object reference][ObjectReference], this is the equivalent of a pointer and refers to the object ID by insertion
order.

## Date

| 1    | 8     |
| :--: | :---: |
| `17` | Bytes |

A [Date][] object followed by an IEEE 754 integer value (can be converted to an unsigned 64 bit number for most
languages).

## BooleanObject

| 1    | 1     |
| :--: | :---: |
| `18` | Value |

A wrapped [boolean object][BooleanObject], same as `Boolean` but as an object instead of a primitive.

## NumberObject

| 1    |
| :--: |
| `19` |

A wrapped IEEE754 [number object][NumberObject], different to `PFloat64` and `NFloat64` as it includes the sign.

## StringObject

| 1    |
| :--: |
| `20` |

A wrapped [string object][StringObject], same as `String` but as an object instead of a primitive.

## EmptyObject

| 1    |
| :--: |
| `21` |

An [Object][] without enumerated properties.

## Object

| 1    |       | 1    |
| :--: | :---: | :--: |
| `22` | Pairs | Tail |

An [Object][] value made of as many pairs until it finds an ending `NullPointer` (`0x00`) tail, equivalent of
`Dictionary` for other languages.

Each pair is a key (typically `String` or any numeric type) and a value of any type.

## RegExp

| 1    |      | 1    | 1     |
| :--: | :--: | :--: | :---: |
| `23` | Char | Tail | Flags |

A [RegExp][] instance, it's encoded as a `String` (with the tail) and 8 bytes for the flags:

- `0b0000_0001` (`1 << 0`) = `Global`
- `0b0000_0010` (`1 << 1`) = `Ignore Case`
- `0b0000_0100` (`1 << 2`) = `Multiline`
- `0b0000_1000` (`1 << 3`) = `Sticky`
- `0b0001_0000` (`1 << 4`) = `Unicode`
- `0b0010_0000` (`1 << 5`) = `DotAll`

## Map

| 1    |       | 1    |
| :--: | :---: | :--: |
| `24` | Pairs | Tail |

A [Map][] value made of as many pairs until it finds an ending `NullPointer` (`0x00`) tail, equivalent of `Map` for
other languages, or `HashMap`/`UnorderedMap`, it is read the same way as `Object`.

Each pair is a key and a value of any type.

## EmptyMap

| 1    |
| :--: |
| `25` |

An empty [Map][] value, equivalent of an empty `Map` for other languages, or an empty `UnorderedMap`.

## WeakMap

| 1    |
| :--: |
| `26` |

A [WeakMap][], it comes with no data since they are not transferable.

## Set

| 1    |          | 1    |
| :--: | :------: | :--: |
| `27` | Elements | Tail |

A [Set][] made of as many values until it finds an ending `NullPointer` (`0x00`) tail, equivalent of `HashSet` for other
languages, it is read the same way as `Array`.

## EmptySet

| 1    |
| :--: |
| `28` |

An empty [Set][] value, equivalent of an empty `HashSet` for other languages.

## WeakSet

| 1    |
| :--: |
| `29` |

A [WeakSet][], it comes with no data since they are not transferable.

## ArrayBuffer

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `30` | Length | Byte   |

An [ArrayBuffer][], it may be parsed as an array of 8-bit unsigned integers.

## Int8Array

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `31` | Length | Byte   |

An [Int8Array][], it may be read as an array of 8-bit signed integers.

## Uint8Array

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `32` | Length | Byte   |

An [Uint8Array][], it may be read as an array of 8-bit unsigned integers.

## Uint8ClampedArray

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `33` | Length | Byte   |

An [Uint8ClampedArray][], it may be read as an optionally clamped array of 8-bit unsigned integers.

## Int16Array

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `34` | Length | Byte   |

An [Int16Array][], it may be read as an array of 16-bit signed integers.

## Uint16Array

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `35` | Length | Byte   |

An [Uint16Array][], it may be read as an array of 16-bit unsigned integers.

## Int32Array

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `36` | Length | Byte   |

An [Int32Array][], it may be read as an array of 32-bit signed integers.

## Uint32Array

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `37` | Length | Byte   |

An [Uint32Array][], it may be read as an array of 32-bit unsigned integers.

## Float32Array

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `38` | Length | Byte   |

A [Float32Array][], it may be read as an array of 32-bit IEEE 754 floating points.

## Float64Array

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `39` | Length | Byte   |

A [Float64Array][], it may be read as an array of 64-bit IEEE 754 floating points.

## DataView

| 1    | 4      | Length |
| :--: | :----: | :----: |
| `40` | Length | Byte   |

A [DataView][], it may be read as an array of 8-bit unsigned integers.

[Null]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null
[PBigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[NBigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[Boolean]: https://developer.mozilla.org/en-US/docs/Glossary/Boolean
[String]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[Undefined]: https://developer.mozilla.org/en-US/docs/Glossary/undefined
[PByte]: https://en.wikipedia.org/wiki/Byte
[NByte]: https://en.wikipedia.org/wiki/Byte
[PInt32]: https://en.wikipedia.org/wiki/Integer_(computer_science)
[NInt32]: https://en.wikipedia.org/wiki/Integer_(computer_science)
[PFloat64]: https://en.wikipedia.org/wiki/IEEE_754
[NFloat64]: https://en.wikipedia.org/wiki/IEEE_754
[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[EmptyArray]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[ObjectReference]: https://en.wikipedia.org/wiki/Pointer_(computer_programming)
[Date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
[BooleanObject]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[NumberObject]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[StringObject]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[EmptyObject]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[RegExp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[EmptyMap]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[WeakMap]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
[Set]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
[EmptySet]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
[WeakSet]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet
[ArrayBuffer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[Int8Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int8Array
[Uint8Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[Uint8ClampedArray]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
[Int16Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int16Array
[Uint16Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array
[Int32Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array
[Uint32Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array
[Float32Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array
[Float64Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float64Array
[DataView]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
