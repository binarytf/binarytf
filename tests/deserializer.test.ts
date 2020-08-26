import { serialize, deserialize, deserializeWithMetadata } from '../src/index';
import { DeserializerError, DeserializerReason } from '../src/lib/errors/DeserializerError';
import { BinaryTokens } from '../src/lib/util/constants';

test('Deserialize Null', () => {
	expect.assertions(2);

	const serialized = serialize(null);
	const deserialized = deserialize<null>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized).toBe(null);
});

if (typeof BigInt === 'function') {
	test('Deserialize PBigInt', () => {
		expect.assertions(2);

		const serialized = serialize(BigInt('4'));
		const deserialized = deserialize<bigint>(serialized);
		expect(typeof deserialized).toBe('bigint');
		expect(deserialized).toBe(BigInt('4'));
	});

	test('Deserialize PBigInt', () => {
		expect.assertions(2);

		const serialized = serialize(-BigInt('4'));
		const deserialized = deserialize<bigint>(serialized);
		expect(typeof deserialized).toBe('bigint');
		expect(deserialized).toBe(-BigInt('4'));
	});
}

test('Deserialize Boolean', () => {
	expect.assertions(2);

	const serialized = serialize(false);
	const deserialized = deserialize<boolean>(serialized);
	expect(typeof deserialized).toBe('boolean');
	expect(deserialized).toBe(false);
});

test('Deserialize UTF8', () => {
	expect.assertions(2);

	const serialized = serialize('Hello');
	const deserialized = deserialize<string>(serialized);
	expect(typeof deserialized).toBe('string');
	expect(deserialized).toBe('Hello');
});

test('Deserialize UTF16', () => {
	expect.assertions(2);

	const serialized = serialize('⭐');
	const deserialized = deserialize<string>(serialized);
	expect(typeof deserialized).toBe('string');
	expect(deserialized).toBe('⭐');
});

test('Deserialize Undefined', () => {
	expect.assertions(2);

	const serialized = serialize(undefined);
	const deserialized = deserialize<undefined>(serialized);
	expect(typeof deserialized).toBe('undefined');
	expect(deserialized).toBe(undefined);
});

test('Deserialize UnsignedByte', () => {
	expect.assertions(2);

	const serialized = serialize(24);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(deserialized).toBe(24);
});

test('Deserialize SignedByte', () => {
	expect.assertions(2);

	const serialized = serialize(-24);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(deserialized).toBe(-24);
});

test('Deserialize UnsignedInt32', () => {
	expect.assertions(2);

	const serialized = serialize(0xffa);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(deserialized).toBe(0xffa);
});

test('Deserialize SignedInt32', () => {
	expect.assertions(2);

	const serialized = serialize(-0xffa);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(deserialized).toBe(-0xffa);
});

test('Deserialize PFloat64', () => {
	expect.assertions(2);

	const value = 0xffffffff + 0.1;
	const serialized = serialize(value);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(deserialized).toBe(value);
});

test('Deserialize NFloat64', () => {
	expect.assertions(2);

	const value = -0xffffffff - 0.1;
	const serialized = serialize(value);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(deserialized).toBe(value);
});

test('Deserialize NaN', () => {
	expect.assertions(2);

	const serialized = serialize(NaN);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(Number.isNaN(deserialized)).toBeTruthy();
});

test('Deserialize Infinity', () => {
	expect.assertions(2);

	const serialized = serialize(Infinity);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(deserialized).toBe(Infinity);
});

test('Deserialize Unsafe Float', () => {
	expect.assertions(2);

	const serialized = serialize(Number.MAX_VALUE);
	const deserialized = deserialize<number>(serialized);
	expect(typeof deserialized).toBe('number');
	expect(deserialized).toBe(Number.MAX_VALUE);
});

test('Deserialize Array (Empty)', () => {
	expect.assertions(2);

	const serialized = serialize([]);
	const deserialized = deserialize<never[]>(serialized);
	expect(Array.isArray(deserialized)).toBeTruthy();
	expect(deserialized.length).toBe(0);
});

test('Deserialize Array (UnsignedInt32)', () => {
	expect.assertions(3);

	const serialized = serialize([4]);
	const deserialized = deserialize<number[]>(serialized);
	expect(Array.isArray(deserialized)).toBeTruthy();
	expect(deserialized.length).toBe(1);
	expect(deserialized[0]).toBe(4);
});

test('Deserialize Array (Holey)', () => {
	expect.assertions(3);

	// eslint-disable-next-line no-sparse-arrays, array-bracket-spacing
	const serialized = serialize([,]);
	const deserialized = deserialize<never[]>(serialized);
	expect(Array.isArray(deserialized)).toBeTruthy();
	expect(deserialized.length).toBe(1);
	expect(0 in deserialized).toBeFalsy();
});

test('Deserialize Array (Circular)', () => {
	expect.assertions(3);

	const array: unknown[] = [];
	array.push(array);
	const serialized = serialize(array);
	const deserialized = deserialize<unknown[]>(serialized);
	expect(Array.isArray(deserialized)).toBeTruthy();
	expect(deserialized.length).toBe(1);
	expect(deserialized[0]).toBe(deserialized);
});

test('Deserialize Object (Empty)', () => {
	expect.assertions(1);

	const serialized = serialize({});
	const deserialized = deserialize<{}>(serialized);
	expect(deserialized).toEqual({});
});

test('Deserialize Object', () => {
	expect.assertions(1);

	const serialized = serialize({ a: 12 });
	const deserialized = deserialize<{ a: number }>(serialized);
	expect(deserialized).toEqual({ a: 12 });
});

test('Deserialize Object (Circular)', () => {
	expect.assertions(3);

	interface Test {
		a: Test | null;
	}
	const object: Test = { a: null };
	object.a = object;
	const serialized = serialize(object);
	const deserialized = deserialize<Test>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Object).toBeTruthy();
	expect(deserialized === deserialized.a).toBeTruthy();
});

test('Deserialize Date', () => {
	expect.assertions(3);

	const serialized = serialize(new Date(1000));
	const deserialized = deserialize<Date>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Date).toBeTruthy();
	expect(deserialized.valueOf()).toBe(1000);
});

test('Deserialize Boolean Object (True)', () => {
	expect.assertions(3);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new Boolean(true));
	const deserialized = deserialize<Boolean>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Boolean).toBeTruthy();
	expect(deserialized.valueOf()).toBe(true);
});

test('Deserialize Boolean Object (False)', () => {
	expect.assertions(3);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new Boolean(false));
	const deserialized = deserialize<Boolean>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Boolean).toBeTruthy();
	expect(deserialized.valueOf()).toBe(false);
});

test('Deserialize Number Object', () => {
	expect.assertions(3);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new Number(12));
	const deserialized = deserialize<Number>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Number).toBeTruthy();
	expect(deserialized.valueOf()).toBe(12);
});

test('Deserialize String Object', () => {
	expect.assertions(3);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new String('Hello'));
	const deserialized = deserialize<Number>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof String).toBeTruthy();
	expect(deserialized.valueOf()).toBe('Hello');
});

test('Deserialize RegExp', () => {
	expect.assertions(9);

	const serialized = serialize(/ab/);
	const deserialized = deserialize<RegExp>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof RegExp).toBeTruthy();
	expect(deserialized.source).toBe('ab');
	expect(deserialized.global).toBeFalsy();
	expect(deserialized.ignoreCase).toBeFalsy();
	expect(deserialized.multiline).toBeFalsy();
	expect(deserialized.sticky).toBeFalsy();
	expect(deserialized.unicode).toBeFalsy();
	expect(deserialized.dotAll).toBeFalsy();
});

test('Deserialize RegExp (Flag: Global)', () => {
	expect.assertions(6);

	const serialized = serialize(/ab/g);
	const deserialized = deserialize<RegExp>(serialized);
	expect(deserialized.global).toBeTruthy();
	expect(deserialized.ignoreCase).toBeFalsy();
	expect(deserialized.multiline).toBeFalsy();
	expect(deserialized.sticky).toBeFalsy();
	expect(deserialized.unicode).toBeFalsy();
	expect(deserialized.dotAll).toBeFalsy();
});

test('Deserialize RegExp (Flag: IgnoreCase)', () => {
	expect.assertions(6);

	const serialized = serialize(/ab/i);
	const deserialized = deserialize<RegExp>(serialized);
	expect(deserialized.global).toBeFalsy();
	expect(deserialized.ignoreCase).toBeTruthy();
	expect(deserialized.multiline).toBeFalsy();
	expect(deserialized.sticky).toBeFalsy();
	expect(deserialized.unicode).toBeFalsy();
	expect(deserialized.dotAll).toBeFalsy();
});

test('Deserialize RegExp (Flag: Multiline)', () => {
	expect.assertions(6);

	const serialized = serialize(/ab/m);
	const deserialized = deserialize<RegExp>(serialized);
	expect(deserialized.global).toBeFalsy();
	expect(deserialized.ignoreCase).toBeFalsy();
	expect(deserialized.multiline).toBeTruthy();
	expect(deserialized.sticky).toBeFalsy();
	expect(deserialized.unicode).toBeFalsy();
	expect(deserialized.dotAll).toBeFalsy();
});

test('Deserialize RegExp (Flag: Sticky)', () => {
	expect.assertions(6);

	const serialized = serialize(/ab/y);
	const deserialized = deserialize<RegExp>(serialized);
	expect(deserialized.global).toBeFalsy();
	expect(deserialized.ignoreCase).toBeFalsy();
	expect(deserialized.multiline).toBeFalsy();
	expect(deserialized.sticky).toBeTruthy();
	expect(deserialized.unicode).toBeFalsy();
	expect(deserialized.dotAll).toBeFalsy();
});

test('Deserialize RegExp (Flag: Unicode)', () => {
	expect.assertions(6);

	const serialized = serialize(/ab/u);
	const deserialized = deserialize<RegExp>(serialized);
	expect(deserialized.global).toBeFalsy();
	expect(deserialized.ignoreCase).toBeFalsy();
	expect(deserialized.multiline).toBeFalsy();
	expect(deserialized.sticky).toBeFalsy();
	expect(deserialized.unicode).toBeTruthy();
	expect(deserialized.dotAll).toBeFalsy();
});

test('Deserialize RegExp (Flag: DotAll)', () => {
	expect.assertions(6);

	const serialized = serialize(/ab/s);
	const deserialized = deserialize<RegExp>(serialized);
	expect(deserialized.global).toBeFalsy();
	expect(deserialized.ignoreCase).toBeFalsy();
	expect(deserialized.multiline).toBeFalsy();
	expect(deserialized.sticky).toBeFalsy();
	expect(deserialized.unicode).toBeFalsy();
	expect(deserialized.dotAll).toBeTruthy();
});

test('Deserialize RegExp (All Flags)', () => {
	expect.assertions(6);

	const serialized = serialize(/ab/gimsuy);
	const deserialized = deserialize<RegExp>(serialized);
	expect(deserialized.global).toBeTruthy();
	expect(deserialized.ignoreCase).toBeTruthy();
	expect(deserialized.multiline).toBeTruthy();
	expect(deserialized.sticky).toBeTruthy();
	expect(deserialized.unicode).toBeTruthy();
	expect(deserialized.dotAll).toBeTruthy();
});

test('Deserialize Map (Empty)', () => {
	expect.assertions(3);

	const serialized = serialize(new Map());
	const deserialized = deserialize<Map<any, any>>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Map).toBeTruthy();
	expect(deserialized.size).toBe(0);
});

test('Deserialize Map', () => {
	expect.assertions(4);

	const serialized = serialize(new Map([[1, null]]));
	const deserialized = deserialize<Map<any, any>>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Map).toBeTruthy();
	expect(deserialized.size).toBe(1);
	expect(deserialized.get(1)).toBe(null);
});

test('Deserialize Map (Circular)', () => {
	expect.assertions(7);

	const map = new Map();
	map.set('a', map);
	const serialized = serialize(map);
	const deserialized = deserialize<Map<any, any>>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Map).toBeTruthy();
	expect(deserialized.size).toBe(1);

	const [[key, value]] = deserialized;
	expect(typeof key).toBe('string');
	expect(key).toBe('a');
	expect(value instanceof Map).toBeTruthy();
	expect(value).toBe(deserialized);
});

test('Deserialize Set (Empty)', () => {
	expect.assertions(3);

	const serialized = serialize(new Set());
	const deserialized = deserialize<Set<unknown>>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Set).toBeTruthy();
	expect(deserialized.size).toBe(0);
});

test('Deserialize Set', () => {
	expect.assertions(4);

	const serialized = serialize(new Set([null]));
	const deserialized = deserialize<Set<null>>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Set).toBeTruthy();
	expect(deserialized.size).toBe(1);
	expect(deserialized.values().next().value).toBe(null);
});

test('Deserialize Set (Circular)', () => {
	expect.assertions(8);

	const set = new Set();
	set.add(new Set());
	set.add(set);
	const serialized = serialize(set);
	const deserialized = deserialize<Set<Set<unknown>>>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(deserialized instanceof Set).toBeTruthy();
	expect(deserialized.size).toBe(2);

	const [first, second] = deserialized;
	expect(first instanceof Set).toBeTruthy();
	expect(first.size).toBe(0);

	expect(second instanceof Set).toBeTruthy();
	expect(second.size).toBe(2);
	expect(second).toBe(deserialized);
});

test('Deserialize Multiple (Circular)', () => {
	expect.assertions(16);

	interface Test {
		map: Map<number, Test> | null;
		set: Set<Test> | null;
		array: Test[];
	}

	const object: Test = { map: null, set: null, array: [] };
	object.map = new Map([[1, object]]);
	object.set = new Set([object]);
	object.array.push(object);
	const serialized = serialize(object);
	const deserialized = deserialize<Test>(serialized);

	expect(deserialized).not.toBe(null);
	expect(typeof deserialized).toBe('object');
	expect(Object.keys(deserialized).length).toBe(3);
	expect('map' in deserialized).toBeTruthy();
	expect('set' in deserialized).toBeTruthy();
	expect('array' in deserialized).toBeTruthy();

	expect(deserialized.map instanceof Map).toBeTruthy();
	expect(deserialized.map!.size).toBe(1);
	expect(deserialized.map!.keys().next().value).toBe(1);
	expect(deserialized.map!.values().next().value).toBe(deserialized);

	expect(deserialized.set instanceof Set).toBeTruthy();
	expect(deserialized.set!.size).toBe(1);
	expect(deserialized.set!.keys().next().value).toBe(deserialized);

	expect(Array.isArray(deserialized.array)).toBeTruthy();
	expect(deserialized.array.length).toBe(1);
	expect(deserialized.array[0]).toBe(deserialized);
});

test('Deserialize Multiple (Cross-Circular)', () => {
	expect.assertions(16);

	type CircularMap = Map<string, unknown | Set<unknown | Test> | Set<unknown | Test> | Test>;
	type CircularSet = Set<Map<string, unknown | Set<unknown | Test> | Test> | unknown | Test>;
	interface Test {
		circle: Test | null;
		map: CircularMap;
		set: CircularSet;
	}
	const object: Test = { circle: null, map: new Map(), set: new Set() };
	object.map.set('set', object.set);
	object.map.set('map', object.map);
	object.set.add(object.set);
	object.set.add(object.map);
	object.circle = object;

	const serialized = serialize(object);
	const deserialized = deserialize<Test>(serialized);
	expect(typeof deserialized).toBe('object');
	expect(Object.keys(deserialized).length).toBe(3);
	expect('circle' in deserialized).toBeTruthy();
	expect('map' in deserialized).toBeTruthy();
	expect('set' in deserialized).toBeTruthy();

	expect(deserialized.map instanceof Map).toBeTruthy();
	expect(deserialized.map!.size).toBe(2);
	const mapKeysIterator = deserialized.map!.keys();
	expect(mapKeysIterator.next().value).toBe('set');
	expect(mapKeysIterator.next().value).toBe('map');
	const mapValuesIterator = deserialized.map!.values();
	expect(mapValuesIterator.next().value).toBe(deserialized.set);
	expect(mapValuesIterator.next().value).toBe(deserialized.map);

	expect(deserialized.set instanceof Set).toBeTruthy();
	expect(deserialized.set!.size).toBe(2);
	const setKeysIterator = deserialized.set!.keys();
	expect(setKeysIterator.next().value).toBe(deserialized.set);
	expect(setKeysIterator.next().value).toBe(deserialized.map);

	expect(deserialized.circle).toBe(deserialized);
});

test('Deserialize Object Nested (Circular)', () => {
	expect.assertions(13);

	interface Test {
		a: { b: InnerTest; obj: Test | null };
	}
	interface InnerTest {
		c: boolean;
		d: InnerTest | null;
	}

	const obj: Test = { a: { b: { c: true, d: null }, obj: null } };
	obj.a.obj = obj;
	obj.a.b.d = obj.a.b;
	const serialized = serialize(obj);
	const deserialized = deserialize<Test>(serialized);

	expect(deserialized).not.toBe(null);
	expect(typeof deserialized).toBe('object');
	expect(Object.keys(deserialized).length).toBe(1);

	// obj | { a: [Object] }
	expect('a' in deserialized).toBeTruthy();
	expect(Object.keys(deserialized.a).length).toBe(2);

	// obj.a | { b: [Object], obj: [Object] }
	expect('b' in deserialized.a).toBeTruthy();
	expect(Object.keys(deserialized.a.b).length).toBe(2);

	// obj.a.b | { c: true, d: [Circular] }
	expect('c' in deserialized.a.b).toBeTruthy();
	expect(deserialized.a.b.c).toBe(true);

	// obj.a.b | { c: true, d: [Circular] }
	expect('d' in deserialized.a.b).toBeTruthy();
	expect(deserialized.a.b.d).toBe(deserialized.a.b);

	// obj.a | { b: [Object], obj: [Object] }
	expect('obj' in deserialized.a).toBeTruthy();
	expect(deserialized.a.obj).toBe(deserialized);
});

test('Deserialize ArrayBuffer', () => {
	expect.assertions(6);

	const buffer = new ArrayBuffer(4);
	{
		const uint8Array = new Uint8Array(buffer);
		for (let i = 0; i < uint8Array.length; i++) uint8Array[i] = i;
	}

	const serialized = serialize(buffer);
	const deserialized = deserialize<ArrayBuffer>(serialized);

	expect(deserialized instanceof ArrayBuffer).toBeTruthy();
	expect(deserialized.byteLength).toBe(4);

	{
		const uint8Array = new Uint8Array(deserialized);
		expect(uint8Array[0]).toBe(0);
		expect(uint8Array[1]).toBe(1);
		expect(uint8Array[2]).toBe(2);
		expect(uint8Array[3]).toBe(3);
	}
});

test('Deserialize Int8Array', () => {
	expect.assertions(7);

	const value = new Int8Array([-10, -5, 0, 5, 10]);
	const serialized = serialize(value);
	const deserialized = deserialize<Int8Array>(serialized);

	expect(deserialized instanceof Int8Array).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize Uint8Array', () => {
	expect.assertions(7);

	const value = new Uint8Array([0, 1, 2, 5, 0xff]);
	const serialized = serialize(value);
	const deserialized = deserialize<Uint8Array>(serialized);

	expect(deserialized instanceof Uint8Array).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize Uint8ClampedArray', () => {
	expect.assertions(7);

	const value = new Uint8ClampedArray([0, 1, 2, 5, 0xff]);
	const serialized = serialize(value);
	const deserialized = deserialize<Uint8ClampedArray>(serialized);

	expect(deserialized instanceof Uint8ClampedArray).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize Int16Array', () => {
	expect.assertions(7);

	const value = new Int16Array([-0x7ffe, 1, 2, 0xff, 0x7fff]);
	const serialized = serialize(value);
	const deserialized = deserialize<Int16Array>(serialized);

	expect(deserialized instanceof Int16Array).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize Uint16Array', () => {
	expect.assertions(7);

	const value = new Uint16Array([0, 1, 2, 0xff, 0xffff]);
	const serialized = serialize(value);
	const deserialized = deserialize<Uint16Array>(serialized);

	expect(deserialized instanceof Uint16Array).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize Int32Array', () => {
	expect.assertions(7);

	const value = new Int32Array([-0x7ffffffe, 1, 2, 0xff, 0x7fffffff]);
	const serialized = serialize(value);
	const deserialized = deserialize<Int32Array>(serialized);

	expect(deserialized instanceof Int32Array).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize Uint32Array', () => {
	expect.assertions(7);

	const value = new Uint32Array([0, 1, 2, 0xff, 0xffffffff]);
	const serialized = serialize(value);
	const deserialized = deserialize<Uint32Array>(serialized);

	expect(deserialized instanceof Uint32Array).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize Float32Array', () => {
	expect.assertions(7);

	const value = new Float32Array([-50, 3.14159, 4.2, 5.1234, 54321.4321]);
	const serialized = serialize(value);
	const deserialized = deserialize<Float32Array>(serialized);

	expect(deserialized instanceof Float32Array).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize Float64Array', () => {
	expect.assertions(7);

	const value = new Float64Array([-500, 3.141592653589793, 4.2, 5.12345678, 54321.4321234]);
	const serialized = serialize(value);
	const deserialized = deserialize<Float64Array>(serialized);

	expect(deserialized instanceof Float64Array).toBeTruthy();
	expect(deserialized.length).toBe(value.length);
	expect(deserialized[0]).toBe(value[0]);
	expect(deserialized[1]).toBe(value[1]);
	expect(deserialized[2]).toBe(value[2]);
	expect(deserialized[3]).toBe(value[3]);
	expect(deserialized[4]).toBe(value[4]);
});

test('Deserialize DataView', () => {
	expect.assertions(6);

	const buffer = new ArrayBuffer(4);
	const uint8Array = new Uint8Array(buffer);
	for (let i = 0; i < uint8Array.length; i++) uint8Array[i] = i;
	const value = new DataView(buffer);
	const serialized = serialize(value);
	const deserialized = deserialize<DataView>(serialized);

	expect(deserialized instanceof DataView).toBeTruthy();
	expect(deserialized.byteLength).toBe(value.byteLength);

	const deserializedBuffer = new Uint8Array(deserialized.buffer);
	expect(deserializedBuffer[0]).toBe(uint8Array[0]);
	expect(deserializedBuffer[1]).toBe(uint8Array[1]);
	expect(deserializedBuffer[2]).toBe(uint8Array[2]);
	expect(deserializedBuffer[3]).toBe(uint8Array[3]);
});

test('Deserialize WeakMap', () => {
	expect.assertions(1);

	const serialized = serialize(new WeakMap());
	const deserialized = deserialize<WeakMap<object, unknown>>(serialized);

	expect(deserialized instanceof WeakMap).toBeTruthy();
});

test('Deserialize WeakSet', () => {
	expect.assertions(1);

	const serialized = serialize(new WeakSet());
	const deserialized = deserialize<WeakSet<object>>(serialized);

	expect(deserialized instanceof WeakSet).toBeTruthy();
});

test('Deserialize Unsupported Types', () => {
	expect.assertions(1);

	const serialized = serialize(
		() => {},
		() => null
	);
	const deserialized = deserialize<null>(serialized);

	expect(deserialized).toBe(null);
});

test('Deserialize Object With Unsupported Types', () => {
	expect.assertions(2);

	interface Test {
		a: boolean;
		b: symbol;
	}
	interface ExpectedTest {
		a: boolean;
		b: string;
	}

	const value: Test = { a: true, b: Symbol('') };
	const serialized = serialize(value, () => 'Wrong Input');
	const deserialized = deserialize<ExpectedTest>(serialized);

	expect(typeof deserialized).toBe('object');
	expect(deserialized).toEqual({ a: true, b: 'Wrong Input' });
});

test('Deserialize Value Offsets', () => {
	expect.assertions(3);

	const value = [1, 2, 3];
	const serialized = serialize(value);

	expect(deserialize<number>(serialized, 1)).toBe(1);
	expect(deserialize<number>(serialized, 3)).toBe(2);
	expect(deserialize<number>(serialized, 5)).toBe(3);
});

test('Deserialize Forged Buffer (Invalid Type)', (done) => {
	expect.assertions(2);
	try {
		const uint8Array = new Uint8Array(1);
		uint8Array[0] = 0xff;
		deserialize<never>(uint8Array);
		done.fail('Deserialize should fail.');
	} catch (error) {
		expect(error instanceof DeserializerError).toBeTruthy();
		expect((error as DeserializerError).kind).toBe(DeserializerReason.UnknownType);
	}
});

test('Deserialize Forged Buffer (Invalid Number)', (done) => {
	expect.assertions(2);
	try {
		const uint8Array = new Uint8Array(2);
		uint8Array[0] = BinaryTokens.UnsignedInt32;
		uint8Array[1] = 0x12;
		deserialize<never>(uint8Array);
		done.fail('Deserialize should fail.');
	} catch (error) {
		expect(error instanceof DeserializerError).toBeTruthy();
		expect((error as DeserializerError).kind).toBe(DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Invalid BigInt | Missing ByteLength)', (done) => {
	expect.assertions(2);
	try {
		const uint8Array = new Uint8Array(1);
		uint8Array[0] = BinaryTokens.PBigInt;
		deserialize<never>(uint8Array);
		done.fail('Deserialize should fail.');
	} catch (error) {
		expect(error instanceof DeserializerError).toBeTruthy();
		expect((error as DeserializerError).kind).toBe(DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Invalid BigInt | Missing Value)', (done) => {
	expect.assertions(2);
	try {
		const uint8Array = new Uint8Array(5);
		uint8Array[0] = BinaryTokens.PBigInt;
		uint8Array[1] = 0x00;
		uint8Array[2] = 0x00;
		uint8Array[3] = 0x00;
		uint8Array[4] = 0x06;
		deserialize<never>(uint8Array);
		done.fail('Deserialize should fail.');
	} catch (error) {
		expect(error instanceof DeserializerError).toBeTruthy();
		expect((error as DeserializerError).kind).toBe(DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Invalid TypedArray | Missing ByteLength)', (done) => {
	expect.assertions(2);
	try {
		const uint8Array = new Uint8Array(1);
		uint8Array[0] = BinaryTokens.Uint8Array;
		deserialize<never>(uint8Array);
		done.fail('Deserialize should fail.');
	} catch (error) {
		expect(error instanceof DeserializerError).toBeTruthy();
		expect((error as DeserializerError).kind).toBe(DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Invalid TypedArray | Missing Value)', (done) => {
	expect.assertions(2);
	try {
		const uint8Array = new Uint8Array(5);
		uint8Array[0] = BinaryTokens.Uint8Array;
		uint8Array[1] = 0x00;
		uint8Array[2] = 0x00;
		uint8Array[3] = 0x00;
		uint8Array[4] = 0x06;
		deserialize<never>(uint8Array);
		done.fail('Deserialize should fail.');
	} catch (error) {
		expect(error instanceof DeserializerError).toBeTruthy();
		expect((error as DeserializerError).kind).toBe(DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (String Invalid Null Pointer)', (done) => {
	expect.assertions(2);
	try {
		const uint8Array = new Uint8Array(2);
		uint8Array[0] = BinaryTokens.String;
		uint8Array[1] = 0x61;
		deserialize<never>(uint8Array);
		done.fail('Deserialize should fail.');
	} catch (error) {
		expect(error instanceof DeserializerError).toBeTruthy();
		expect((error as DeserializerError).kind).toBe(DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize Forged Buffer (Array Invalid Null Pointer)', (done) => {
	expect.assertions(2);
	try {
		const uint8Array = new Uint8Array(2);
		uint8Array[0] = BinaryTokens.Array;
		uint8Array[1] = BinaryTokens.Null;
		deserialize<never>(uint8Array);
		done.fail('Deserialize should fail.');
	} catch (error) {
		expect(error instanceof DeserializerError).toBeTruthy();
		expect((error as DeserializerError).kind).toBe(DeserializerReason.UnexpectedEndOfBuffer);
	}
});

test('Deserialize With Metadata (Simple)', () => {
	expect.assertions(3);

	const serialized = serialize('Hello World');
	const metadata = deserializeWithMetadata<string>(serialized);

	// The return of the metadata must always be an object
	expect(typeof metadata).toBe('object');

	// Test the offset
	expect(metadata.offset).toBe(-1);

	// Test the serialized data
	expect(metadata.value).toBe('Hello World');
});

test('Deserialize With Metadata (Combinated)', () => {
	expect.assertions(4);

	const hello = serialize('Hello');
	const world = serialize('World');
	const serialized = new Uint8Array(hello.byteLength + world.byteLength);
	serialized.set(hello, 0);
	serialized.set(world, hello.byteLength);

	// First part
	{
		const metadata = deserializeWithMetadata<string>(serialized);

		// Test the offset
		expect(metadata.offset).toBe(hello.byteLength);

		// Test the serialized data
		expect(metadata.value).toBe('Hello');
	}

	// Second part
	{
		const metadata = deserializeWithMetadata<string>(serialized, hello.byteLength);

		// Test the offset
		expect(metadata.offset).toBe(-1);

		// Test the serialized data
		expect(metadata.value).toBe('World');
	}
});
