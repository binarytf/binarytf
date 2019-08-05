import * as test from 'tape';
import { serialize, deserialize, deserializeWithMetadata } from '../index';
import { DeserializerError, DeserializerReason } from '../lib/errors/DeserializerError';
import { BinaryTokens } from '../lib/util/constants';

test('Deserialize Null', t => {
	t.plan(2);

	const serialized = serialize(null);
	const deserialized = deserialize<null>(serialized);
	t.equal(typeof deserialized, 'object');
	t.equal(deserialized, null);
});

if (typeof BigInt === 'function') {
	test('Deserialize PBigInt', t => {
		t.plan(2);

		const serialized = serialize(BigInt('4'));
		const deserialized = deserialize<bigint>(serialized);
		t.equal(typeof deserialized, 'bigint');
		t.equal(deserialized, BigInt('4'));
	});

	test('Deserialize PBigInt', t => {
		t.plan(2);

		const serialized = serialize(-BigInt('4'));
		const deserialized = deserialize<bigint>(serialized);
		t.equal(typeof deserialized, 'bigint');
		t.equal(deserialized, -BigInt('4'));
	});
}

test('Deserialize Boolean', t => {
	t.plan(2);

	const serialized = serialize(false);
	const deserialized = deserialize<boolean>(serialized);
	t.equal(typeof deserialized, 'boolean');
	t.equal(deserialized, false);
});

test('Deserialize UTF8', t => {
	t.plan(2);

	const serialized = serialize('Hello');
	const deserialized = deserialize<string>(serialized);
	t.equal(typeof deserialized, 'string');
	t.equal(deserialized, 'Hello');
});

test('Deserialize UTF16', t => {
	t.plan(2);

	const serialized = serialize('⭐');
	const deserialized = deserialize<string>(serialized);
	t.equal(typeof deserialized, 'string');
	t.equal(deserialized, '⭐');
});

test('Deserialize Undefined', t => {
	t.plan(2);

	const serialized = serialize(undefined);
	const deserialized = deserialize<undefined>(serialized);
	t.equal(typeof deserialized, 'undefined');
	t.equal(deserialized, undefined);
});

test('Deserialize UnsignedByte', t => {
	t.plan(2);

	const serialized = serialize(24);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, 24);
});

test('Deserialize SignedByte', t => {
	t.plan(2);

	const serialized = serialize(-24);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, -24);
});

test('Deserialize UnsignedInt32', t => {
	t.plan(2);

	const serialized = serialize(0xFFA);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, 0xFFA);
});

test('Deserialize SignedInt32', t => {
	t.plan(2);

	const serialized = serialize(-0xFFA);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, -0xFFA);
});

test('Deserialize PFloat64', t => {
	t.plan(2);

	const value = 0xFFFFFFFF + 0.1;
	const serialized = serialize(value);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, value);
});

test('Deserialize NFloat64', t => {
	t.plan(2);

	const value = -0xFFFFFFFF - 0.1;
	const serialized = serialize(value);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, value);
});

test('Deserialize NaN', t => {
	t.plan(2);

	const serialized = serialize(NaN);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.true(Number.isNaN(deserialized));
});

test('Deserialize Infinity', t => {
	t.plan(2);

	const serialized = serialize(Infinity);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, Infinity);
});

test('Deserialize Unsafe Float', t => {
	t.plan(2);

	const serialized = serialize(Number.MAX_VALUE);
	const deserialized = deserialize<number>(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, Number.MAX_VALUE);
});

test('Deserialize Array (Empty)', t => {
	t.plan(2);

	const serialized = serialize([]);
	const deserialized = deserialize<never[]>(serialized);
	t.true(Array.isArray(deserialized));
	t.equal(deserialized.length, 0);
});

test('Deserialize Array (UnsignedInt32)', t => {
	t.plan(3);

	const serialized = serialize([4]);
	const deserialized = deserialize<number[]>(serialized);
	t.true(Array.isArray(deserialized));
	t.equal(deserialized.length, 1);
	t.equal(deserialized[0], 4);
});

test('Deserialize Array (Holey)', t => {
	t.plan(3);

	// eslint-disable-next-line no-sparse-arrays, array-bracket-spacing
	const serialized = serialize([, ]);
	const deserialized = deserialize<never[]>(serialized);
	t.true(Array.isArray(deserialized));
	t.equal(deserialized.length, 1);
	t.false(0 in deserialized);
});

test('Deserialize Array (Circular)', t => {
	t.plan(3);

	const array: unknown[] = [];
	array.push(array);
	const serialized = serialize(array);
	const deserialized = deserialize<unknown[]>(serialized);
	t.true(Array.isArray(deserialized));
	t.equal(deserialized.length, 1);
	t.equal(deserialized[0], deserialized);
});

test('Deserialize Object (Empty)', t => {
	t.plan(1);

	const serialized = serialize({});
	const deserialized = deserialize<{}>(serialized);
	t.deepEqual(deserialized, {});
});

test('Deserialize Object', t => {
	t.plan(1);

	const serialized = serialize({ a: 12 });
	const deserialized = deserialize<{ a: number }>(serialized);
	t.deepEqual(deserialized, { a: 12 });
});

test('Deserialize Object (Circular)', t => {
	t.plan(3);

	interface Test { a: Test | null }
	const object: Test = { a: null };
	object.a = object;
	const serialized = serialize(object);
	const deserialized = deserialize<Test>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Object);
	t.assert(deserialized === deserialized.a);
});

test('Deserialize Date', t => {
	t.plan(3);

	const serialized = serialize(new Date(1000));
	const deserialized = deserialize<Date>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Date);
	t.equal(deserialized.valueOf(), 1000);
});

test('Deserialize Boolean Object (True)', t => {
	t.plan(3);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new Boolean(true));
	// eslint-disable-next-line @typescript-eslint/ban-types
	const deserialized = deserialize<Boolean>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Boolean);
	t.equal(deserialized.valueOf(), true);
});

test('Deserialize Boolean Object (False)', t => {
	t.plan(3);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new Boolean(false));
	// eslint-disable-next-line @typescript-eslint/ban-types
	const deserialized = deserialize<Boolean>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Boolean);
	t.equal(deserialized.valueOf(), false);
});

test('Deserialize Number Object', t => {
	t.plan(3);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new Number(12));
	// eslint-disable-next-line @typescript-eslint/ban-types
	const deserialized = deserialize<Number>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Number);
	t.equal(deserialized.valueOf(), 12);
});

test('Deserialize String Object', t => {
	t.plan(3);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new String('Hello'));
	// eslint-disable-next-line @typescript-eslint/ban-types
	const deserialized = deserialize<Number>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof String);
	t.equal(deserialized.valueOf(), 'Hello');
});

test('Deserialize RegExp', t => {
	t.plan(9);

	const serialized = serialize(/ab/);
	const deserialized = deserialize<RegExp>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof RegExp);
	t.equal(deserialized.source, 'ab');
	t.false(deserialized.global);
	t.false(deserialized.ignoreCase);
	t.false(deserialized.multiline);
	t.false(deserialized.sticky);
	t.false(deserialized.unicode);
	t.false(deserialized.dotAll);
});

test('Deserialize RegExp (Flag: Global)', t => {
	t.plan(6);

	const serialized = serialize(/ab/g);
	const deserialized = deserialize<RegExp>(serialized);
	t.true(deserialized.global);
	t.false(deserialized.ignoreCase);
	t.false(deserialized.multiline);
	t.false(deserialized.sticky);
	t.false(deserialized.unicode);
	t.false(deserialized.dotAll);
});

test('Deserialize RegExp (Flag: IgnoreCase)', t => {
	t.plan(6);

	const serialized = serialize(/ab/i);
	const deserialized = deserialize<RegExp>(serialized);
	t.false(deserialized.global);
	t.true(deserialized.ignoreCase);
	t.false(deserialized.multiline);
	t.false(deserialized.sticky);
	t.false(deserialized.unicode);
	t.false(deserialized.dotAll);
});

test('Deserialize RegExp (Flag: Multiline)', t => {
	t.plan(6);

	const serialized = serialize(/ab/m);
	const deserialized = deserialize<RegExp>(serialized);
	t.false(deserialized.global);
	t.false(deserialized.ignoreCase);
	t.true(deserialized.multiline);
	t.false(deserialized.sticky);
	t.false(deserialized.unicode);
	t.false(deserialized.dotAll);
});

test('Deserialize RegExp (Flag: Sticky)', t => {
	t.plan(6);

	const serialized = serialize(/ab/y);
	const deserialized = deserialize<RegExp>(serialized);
	t.false(deserialized.global);
	t.false(deserialized.ignoreCase);
	t.false(deserialized.multiline);
	t.true(deserialized.sticky);
	t.false(deserialized.unicode);
	t.false(deserialized.dotAll);
});

test('Deserialize RegExp (Flag: Unicode)', t => {
	t.plan(6);

	const serialized = serialize(/ab/u);
	const deserialized = deserialize<RegExp>(serialized);
	t.false(deserialized.global);
	t.false(deserialized.ignoreCase);
	t.false(deserialized.multiline);
	t.false(deserialized.sticky);
	t.true(deserialized.unicode);
	t.false(deserialized.dotAll);
});

test('Deserialize RegExp (Flag: DotAll)', t => {
	t.plan(6);

	const serialized = serialize(/ab/s);
	const deserialized = deserialize<RegExp>(serialized);
	t.false(deserialized.global);
	t.false(deserialized.ignoreCase);
	t.false(deserialized.multiline);
	t.false(deserialized.sticky);
	t.false(deserialized.unicode);
	t.true(deserialized.dotAll);
});

test('Deserialize RegExp (All Flags)', t => {
	t.plan(6);

	const serialized = serialize(/ab/gimyus);
	const deserialized = deserialize<RegExp>(serialized);
	t.true(deserialized.global);
	t.true(deserialized.ignoreCase);
	t.true(deserialized.multiline);
	t.true(deserialized.sticky);
	t.true(deserialized.unicode);
	t.true(deserialized.dotAll);
});

test('Deserialize Map (Empty)', t => {
	t.plan(3);

	const serialized = serialize(new Map());
	const deserialized = deserialize<Map<any, any>>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Map);
	t.equal(deserialized.size, 0);
});

test('Deserialize Map', t => {
	t.plan(4);

	const serialized = serialize(new Map([[1, null]]));
	const deserialized = deserialize<Map<any, any>>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Map);
	t.equal(deserialized.size, 1);
	t.equal(deserialized.get(1), null);
});

test('Deserialize Map (Circular)', t => {
	t.plan(7);

	const map = new Map();
	map.set('a', map);
	const serialized = serialize(map);
	const deserialized = deserialize<Map<any, any>>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Map);
	t.equal(deserialized.size, 1);

	const [[key, value]] = deserialized;
	t.equal(typeof key, 'string');
	t.equal(key, 'a');
	t.true(value instanceof Map);
	t.equal(value, deserialized);
});

test('Deserialize Set (Empty)', t => {
	t.plan(3);

	const serialized = serialize(new Set());
	const deserialized = deserialize<Set<unknown>>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Set);
	t.equal(deserialized.size, 0);
});

test('Deserialize Set', t => {
	t.plan(4);

	const serialized = serialize(new Set([null]));
	const deserialized = deserialize<Set<null>>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Set);
	t.equal(deserialized.size, 1);
	t.equal(deserialized.values().next().value, null);
});

test('Deserialize Set (Circular)', t => {
	t.plan(8);

	const set = new Set();
	set.add(new Set());
	set.add(set);
	const serialized = serialize(set);
	const deserialized = deserialize<Set<Set<unknown>>>(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Set);
	t.equal(deserialized.size, 2);

	const [first, second] = deserialized;
	t.true(first instanceof Set);
	t.equal(first.size, 0);

	t.true(second instanceof Set);
	t.equal(second.size, 2);
	t.equal(second, deserialized);
});

test('Deserialize Multiple (Circular)', t => {
	t.plan(16);

	interface Test { map: Map<number, Test> | null; set: Set<Test> | null; array: Test[] }

	const object: Test = { map: null, set: null, array: [] };
	object.map = new Map([[1, object]]);
	object.set = new Set([object]);
	object.array.push(object);
	const serialized = serialize(object);
	const deserialized = deserialize<Test>(serialized);

	t.notEqual(deserialized, null);
	t.equal(typeof deserialized, 'object');
	t.equal(Object.keys(deserialized).length, 3);
	t.true('map' in deserialized);
	t.true('set' in deserialized);
	t.true('array' in deserialized);

	t.true(deserialized.map instanceof Map);
	t.equal(deserialized.map!.size, 1);
	t.equal(deserialized.map!.keys().next().value, 1);
	t.equal(deserialized.map!.values().next().value, deserialized);

	t.true(deserialized.set instanceof Set);
	t.equal(deserialized.set!.size, 1);
	t.equal(deserialized.set!.keys().next().value, deserialized);

	t.true(Array.isArray(deserialized.array));
	t.equal(deserialized.array.length, 1);
	t.equal(deserialized.array[0], deserialized);
});

test('Deserialize Multiple (Cross-Circular)', t => {
	t.plan(16);

	type CircularMap = Map<string, unknown | Set<unknown | Test> | Set<unknown | Test> | Test>;
	type CircularSet = Set<Map<string, unknown | Set<unknown | Test> | Test> | unknown | Test>;
	interface Test { circle: Test | null; map: CircularMap; set: CircularSet }
	const object: Test = { circle: null, map: new Map(), set: new Set() };
	object.map.set('set', object.set);
	object.map.set('map', object.map);
	object.set.add(object.set);
	object.set.add(object.map);
	object.circle = object;

	const serialized = serialize(object);
	const deserialized = deserialize<Test>(serialized);
	t.equal(typeof deserialized, 'object');
	t.equal(Object.keys(deserialized).length, 3);
	t.true('circle' in deserialized);
	t.true('map' in deserialized);
	t.true('set' in deserialized);

	t.true(deserialized.map instanceof Map);
	t.equal(deserialized.map!.size, 2);
	const mapKeysIterator = deserialized.map!.keys();
	t.equal(mapKeysIterator.next().value, 'set');
	t.equal(mapKeysIterator.next().value, 'map');
	const mapValuesIterator = deserialized.map!.values();
	t.equal(mapValuesIterator.next().value, deserialized.set);
	t.equal(mapValuesIterator.next().value, deserialized.map);

	t.true(deserialized.set instanceof Set);
	t.equal(deserialized.set!.size, 2);
	const setKeysIterator = deserialized.set!.keys();
	t.equal(setKeysIterator.next().value, deserialized.set);
	t.equal(setKeysIterator.next().value, deserialized.map);

	t.equal(deserialized.circle, deserialized);
});

test('Deserialize Object Nested (Circular)', t => {
	t.plan(13);

	interface Test { a: { b: InnerTest; obj: Test | null } }
	interface InnerTest { c: boolean; d: InnerTest | null }

	const obj: Test = { a: { b: { c: true, d: null }, obj: null } };
	obj.a.obj = obj;
	obj.a.b.d = obj.a.b;
	const serialized = serialize(obj);
	const deserialized = deserialize<Test>(serialized);

	t.notEqual(deserialized, null);
	t.equal(typeof deserialized, 'object');
	t.equal(Object.keys(deserialized).length, 1);

	// obj | { a: [Object] }
	t.true('a' in deserialized);
	t.equal(Object.keys(deserialized.a).length, 2);

	// obj.a | { b: [Object], obj: [Object] }
	t.true('b' in deserialized.a);
	t.equal(Object.keys(deserialized.a.b).length, 2);

	// obj.a.b | { c: true, d: [Circular] }
	t.true('c' in deserialized.a.b);
	t.equal(deserialized.a.b.c, true);

	// obj.a.b | { c: true, d: [Circular] }
	t.true('d' in deserialized.a.b);
	t.equal(deserialized.a.b.d, deserialized.a.b);

	// obj.a | { b: [Object], obj: [Object] }
	t.true('obj' in deserialized.a);
	t.equal(deserialized.a.obj, deserialized);
});

test('Deserialize ArrayBuffer', t => {
	t.plan(6);

	const buffer = new ArrayBuffer(4);
	{
		const uint8Array = new Uint8Array(buffer);
		for (let i = 0; i < uint8Array.length; i++) uint8Array[i] = i;
	}

	const serialized = serialize(buffer);
	const deserialized = deserialize<ArrayBuffer>(serialized);

	t.true(deserialized instanceof ArrayBuffer);
	t.equal(deserialized.byteLength, 4);

	{
		const uint8Array = new Uint8Array(deserialized);
		t.equal(uint8Array[0], 0);
		t.equal(uint8Array[1], 1);
		t.equal(uint8Array[2], 2);
		t.equal(uint8Array[3], 3);
	}
});

test('Deserialize Int8Array', t => {
	t.plan(7);

	const value = new Int8Array([-10, -5, 0, 5, 10]);
	const serialized = serialize(value);
	const deserialized = deserialize<Int8Array>(serialized);

	t.true(deserialized instanceof Int8Array);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize Uint8Array', t => {
	t.plan(7);

	const value = new Uint8Array([0, 1, 2, 5, 0xFF]);
	const serialized = serialize(value);
	const deserialized = deserialize<Uint8Array>(serialized);

	t.true(deserialized instanceof Uint8Array);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize Uint8ClampedArray', t => {
	t.plan(7);

	const value = new Uint8ClampedArray([0, 1, 2, 5, 0xFF]);
	const serialized = serialize(value);
	const deserialized = deserialize<Uint8ClampedArray>(serialized);

	t.true(deserialized instanceof Uint8ClampedArray);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize Int16Array', t => {
	t.plan(7);

	const value = new Int16Array([-0x7FFE, 1, 2, 0xFF, 0x7FFF]);
	const serialized = serialize(value);
	const deserialized = deserialize<Int16Array>(serialized);

	t.true(deserialized instanceof Int16Array);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize Uint16Array', t => {
	t.plan(7);

	const value = new Uint16Array([0, 1, 2, 0xFF, 0xFFFF]);
	const serialized = serialize(value);
	const deserialized = deserialize<Uint16Array>(serialized);

	t.true(deserialized instanceof Uint16Array);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize Int32Array', t => {
	t.plan(7);

	const value = new Int32Array([-0x7FFFFFFE, 1, 2, 0xFF, 0x7FFFFFFF]);
	const serialized = serialize(value);
	const deserialized = deserialize<Int32Array>(serialized);

	t.true(deserialized instanceof Int32Array);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize Uint32Array', t => {
	t.plan(7);

	const value = new Uint32Array([0, 1, 2, 0xFF, 0xFFFFFFFF]);
	const serialized = serialize(value);
	const deserialized = deserialize<Uint32Array>(serialized);

	t.true(deserialized instanceof Uint32Array);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize Float32Array', t => {
	t.plan(7);

	const value = new Float32Array([-50, 3.14159, 4.2, 5.1234, 54321.4321]);
	const serialized = serialize(value);
	const deserialized = deserialize<Float32Array>(serialized);

	t.true(deserialized instanceof Float32Array);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize Float64Array', t => {
	t.plan(7);

	const value = new Float64Array([-500, 3.141592653589793, 4.2, 5.12345678, 54321.4321234]);
	const serialized = serialize(value);
	const deserialized = deserialize<Float64Array>(serialized);

	t.true(deserialized instanceof Float64Array);
	t.equal(deserialized.length, value.length);
	t.equal(deserialized[0], value[0]);
	t.equal(deserialized[1], value[1]);
	t.equal(deserialized[2], value[2]);
	t.equal(deserialized[3], value[3]);
	t.equal(deserialized[4], value[4]);
});

test('Deserialize DataView', t => {
	t.plan(6);

	const buffer = new ArrayBuffer(4);
	const uint8Array = new Uint8Array(buffer);
	for (let i = 0; i < uint8Array.length; i++) uint8Array[i] = i;
	const value = new DataView(buffer);
	const serialized = serialize(value);
	const deserialized = deserialize<DataView>(serialized);

	t.true(deserialized instanceof DataView);
	t.equal(deserialized.byteLength, value.byteLength);

	const deserializedBuffer = new Uint8Array(deserialized.buffer);
	t.equal(deserializedBuffer[0], uint8Array[0]);
	t.equal(deserializedBuffer[1], uint8Array[1]);
	t.equal(deserializedBuffer[2], uint8Array[2]);
	t.equal(deserializedBuffer[3], uint8Array[3]);
});

test('Deserialize WeakMap', t => {
	t.plan(1);

	const serialized = serialize(new WeakMap());
	const deserialized = deserialize<WeakMap<object, unknown>>(serialized);

	t.true(deserialized instanceof WeakMap);
});

test('Deserialize WeakSet', t => {
	t.plan(1);

	const serialized = serialize(new WeakSet());
	const deserialized = deserialize<WeakSet<object>>(serialized);

	t.true(deserialized instanceof WeakSet);
});

test('Deserialize Unsupported Types', t => {
	t.plan(1);

	const serialized = serialize(() => { }, () => null);
	const deserialized = deserialize<null>(serialized);

	t.equal(deserialized, null);
});

test('Deserialize Object With Unsupported Types', t => {
	t.plan(2);

	interface Test { a: boolean; b: symbol }
	interface ExpectedTest { a: boolean; b: string }

	const value: Test = { a: true, b: Symbol('') };
	const serialized = serialize(value, () => 'Wrong Input');
	const deserialized = deserialize<ExpectedTest>(serialized);

	t.equal(typeof deserialized, 'object');
	t.deepEqual(deserialized, { a: true, b: 'Wrong Input' });
});

test('Deserialize Value Offsets', t => {
	t.plan(3);

	const value = [1, 2, 3];
	const serialized = serialize(value);

	t.equal(deserialize<number>(serialized, 1), 1);
	t.equal(deserialize<number>(serialized, 3), 2);
	t.equal(deserialize<number>(serialized, 5), 3);
});

test('Deserialize Forged Buffer (Invalid Type)', t => {
	t.plan(2);
	try {
		const uint8Array = new Uint8Array(1);
		uint8Array[0] = 0xFF;
		deserialize<never>(uint8Array);
		t.fail('Deserialize should fail.');
	} catch (error) {
		t.true(error instanceof DeserializerError);
		t.equal((error as DeserializerError).kind, DeserializerReason.UnknownType);
	}
});

test('Deserialize Forged Buffer (Invalid Number)', t => {
	t.plan(2);
	try {
		const uint8Array = new Uint8Array(2);
		uint8Array[0] = BinaryTokens.UnsignedInt32;
		uint8Array[1] = 0x12;
		deserialize<never>(uint8Array);
		t.fail('Deserialize should fail.');
	} catch (error) {
		t.true(error instanceof DeserializerError);
		t.equal((error as DeserializerError).kind, DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Invalid BigInt | Missing ByteLength)', t => {
	t.plan(2);
	try {
		const uint8Array = new Uint8Array(1);
		uint8Array[0] = BinaryTokens.PBigInt;
		deserialize<never>(uint8Array);
		t.fail('Deserialize should fail.');
	} catch (error) {
		t.true(error instanceof DeserializerError);
		t.equal((error as DeserializerError).kind, DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Invalid BigInt | Missing Value)', t => {
	t.plan(2);
	try {
		const uint8Array = new Uint8Array(5);
		uint8Array[0] = BinaryTokens.PBigInt;
		uint8Array[1] = 0x00;
		uint8Array[2] = 0x00;
		uint8Array[3] = 0x00;
		uint8Array[4] = 0x06;
		deserialize<never>(uint8Array);
		t.fail('Deserialize should fail.');
	} catch (error) {
		t.true(error instanceof DeserializerError);
		t.equal((error as DeserializerError).kind, DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Invalid TypedArray | Missing ByteLength)', t => {
	t.plan(2);
	try {
		const uint8Array = new Uint8Array(1);
		uint8Array[0] = BinaryTokens.Uint8Array;
		deserialize<never>(uint8Array);
		t.fail('Deserialize should fail.');
	} catch (error) {
		t.true(error instanceof DeserializerError);
		t.equal((error as DeserializerError).kind, DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Invalid TypedArray | Missing Value)', t => {
	t.plan(2);
	try {
		const uint8Array = new Uint8Array(5);
		uint8Array[0] = BinaryTokens.Uint8Array;
		uint8Array[1] = 0x00;
		uint8Array[2] = 0x00;
		uint8Array[3] = 0x00;
		uint8Array[4] = 0x06;
		deserialize<never>(uint8Array);
		t.fail('Deserialize should fail.');
	} catch (error) {
		t.true(error instanceof DeserializerError);
		t.equal((error as DeserializerError).kind, DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (String Invalid Null Pointer)', t => {
	t.plan(2);
	try {
		const uint8Array = new Uint8Array(2);
		uint8Array[0] = BinaryTokens.String;
		uint8Array[1] = 0x61;
		deserialize<never>(uint8Array);
		t.fail('Deserialize should fail.');
	} catch (error) {
		t.true(error instanceof DeserializerError);
		t.equal((error as DeserializerError).kind, DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Array Invalid Null Pointer)', t => {
	t.plan(2);
	try {
		const uint8Array = new Uint8Array(2);
		uint8Array[0] = BinaryTokens.Array;
		uint8Array[1] = BinaryTokens.Null;
		deserialize<never>(uint8Array);
		t.fail('Deserialize should fail.');
	} catch (error) {
		t.true(error instanceof DeserializerError);
		t.equal((error as DeserializerError).kind, DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize With Metadata (Simple)', t => {
	t.plan(3);

	const serialized = serialize('Hello World');
	const metadata = deserializeWithMetadata<string>(serialized);

	// The return of the metadata must always be an object
	t.equal(typeof metadata, 'object');

	// Test the offset
	t.equal(metadata.offset, -1);

	// Test the serialized data
	t.equal(metadata.value, 'Hello World');
});

test('Deserialize With Metadata (Combinated)', t => {
	t.plan(4);

	const hello = serialize('Hello');
	const world = serialize('World');
	const serialized = new Uint8Array(hello.byteLength + world.byteLength);
	serialized.set(hello, 0);
	serialized.set(world, hello.byteLength);

	// First part
	{
		const metadata = deserializeWithMetadata<string>(serialized);

		// Test the offset
		t.equal(metadata.offset, hello.byteLength);

		// Test the serialized data
		t.equal(metadata.value, 'Hello');
	}

	// Second part
	{
		const metadata = deserializeWithMetadata<string>(serialized, hello.byteLength);

		// Test the offset
		t.equal(metadata.offset, -1);

		// Test the serialized data
		t.equal(metadata.value, 'World');
	}
});
