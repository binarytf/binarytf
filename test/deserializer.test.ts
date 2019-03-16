import * as test from 'tape';
import { serialize, deserialize } from '../src/index';

test('Deserialize Null', (t) => {
	t.plan(2);

	const serialized = serialize(null);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.equal(deserialized, null);
});

if (typeof BigInt === 'function') {
	test('Deserialize PBigInt', (t) => {
		t.plan(2);

		const serialized = serialize(BigInt('4'));
		const deserialized = deserialize(serialized);
		t.equal(typeof deserialized, 'bigint');
		t.equal(deserialized, BigInt('4'));
	});

	test('Deserialize PBigInt', (t) => {
		t.plan(2);

		const serialized = serialize(-BigInt('4'));
		const deserialized = deserialize(serialized);
		t.equal(typeof deserialized, 'bigint');
		t.equal(deserialized, -BigInt('4'));
	});
}

test('Deserialize Boolean', (t) => {
	t.plan(2);

	const serialized = serialize(false);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'boolean');
	t.equal(deserialized, false);
});

test('Deserialize UTF8', (t) => {
	t.plan(2);

	const serialized = serialize('Hello');
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'string');
	t.equal(deserialized, 'Hello');
});

test('Deserialize UTF16', (t) => {
	t.plan(2);

	const serialized = serialize('⭐');
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'string');
	t.equal(deserialized, '⭐');
});

test('Deserialize Undefined', (t) => {
	t.plan(2);

	const serialized = serialize(undefined);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'undefined');
	t.equal(deserialized, undefined);
});

test('Deserialize PByte', (t) => {
	t.plan(2);

	const serialized = serialize(24);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, 24);
});

test('Deserialize NByte', (t) => {
	t.plan(2);

	const serialized = serialize(-24);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, -24);
});

test('Deserialize PInt32', (t) => {
	t.plan(2);

	const serialized = serialize(0xFFA);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, 0xFFA);
});

test('Deserialize NInt32', (t) => {
	t.plan(2);

	const serialized = serialize(-0xFFA);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, -0xFFA);
});

test('Deserialize PFloat64', (t) => {
	t.plan(2);

	const value = 0xFFFFFFFF + 0.1;
	const serialized = serialize(value);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, value);
});

test('Deserialize NFloat64', (t) => {
	t.plan(2);

	const value = -0xFFFFFFFF - 0.1;
	const serialized = serialize(value);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'number');
	t.equal(deserialized, value);
});

test('Deserialize Array (Empty)', (t) => {
	t.plan(3);

	const serialized = serialize([]);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(Array.isArray(deserialized));
	t.deepEqual(deserialized, []);
});

test('Deserialize Array (PInt32)', (t) => {
	t.plan(3);

	const serialized = serialize([4]);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(Array.isArray(deserialized));
	t.deepEqual(deserialized, [4]);
});

test('Deserialize Array (Holey)', (t) => {
	t.plan(3);

	const serialized = serialize([, ]);
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(Array.isArray(deserialized));
	t.deepEqual(deserialized, [, ]);
});

test('Deserialize Array (Circular)', (t) => {
	t.plan(5);

	const array = [];
	array.push(array);
	const serialized = serialize(array);
	const deserialized = deserialize(serialized) as Array<any>;
	t.equal(typeof deserialized, 'object');
	t.true(Array.isArray(deserialized));
	t.equal(deserialized.length, 1);

	const [first] = deserialized;
	t.true(Array.isArray(first));
	t.equal(first, deserialized);
});

test('Deserialize Object (Empty)', (t) => {
	t.plan(2);

	const serialized = serialize({});
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.deepEqual(deserialized, {});
});

test('Deserialize Object', (t) => {
	t.plan(2);

	const serialized = serialize({ a: 12 });
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.deepEqual(deserialized, { a: 12 });
});

test('Deserialize Object (Circular)', (t) => {
	t.plan(3);

	const object = { a: null };
	object.a = object;
	const serialized = serialize(object);
	const deserialized = deserialize(serialized) as Record<any, any>;
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Object);
	t.assert(deserialized === deserialized.a);
});

test('Deserialize Date', (t) => {
	t.plan(3);

	const serialized = serialize(new Date(1000));
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Date);
	t.equal(deserialized.valueOf(), 1000);
});

test('Deserialize Boolean Object', (t) => {
	t.plan(3);

	const serialized = serialize(new Boolean(true));
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Boolean);
	t.equal(deserialized.valueOf(), true);
});

test('Deserialize Number Object', (t) => {
	t.plan(3);

	const serialized = serialize(new Number(12));
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Number);
	t.equal(deserialized.valueOf(), 12);
});

test('Deserialize String Object', (t) => {
	t.plan(3);

	const serialized = serialize(new String('Hello'));
	const deserialized = deserialize(serialized);
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof String);
	t.equal(deserialized.valueOf(), 'Hello');
});

test('Deserialize RegExp', (t) => {
	t.plan(8);

	const serialized = serialize(/ab/g);
	const deserialized = deserialize(serialized) as RegExp;
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof RegExp);
	t.equal(deserialized.source, 'ab');
	t.true(deserialized.global);
	t.false(deserialized.ignoreCase);
	t.false(deserialized.multiline);
	t.false(deserialized.sticky);
	t.false(deserialized.unicode);
});

test('Deserialize Map (Empty)', (t) => {
	t.plan(3);

	const serialized = serialize(new Map());
	const deserialized = deserialize(serialized) as Map<any, any>;
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Map);
	t.equal(deserialized.size, 0);
});

test('Deserialize Map', (t) => {
	t.plan(4);

	const serialized = serialize(new Map([[1, null]]));
	const deserialized = deserialize(serialized) as Map<any, any>;
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Map);
	t.equal(deserialized.size, 1);
	t.equal(deserialized.get(1), null);
});

test('Deserialize Map (Circular)', (t) => {
	t.plan(7);

	const map = new Map();
	map.set('a', map);
	const serialized = serialize(map);
	const deserialized = deserialize(serialized) as Map<any, any>;
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Map);
	t.equal(deserialized.size, 1);

	const [[key, value]] = deserialized;
	t.equal(typeof key, 'string');
	t.equal(key, 'a');
	t.true(value instanceof Map);
	t.equal(value, deserialized);
});

test('Deserialize Set (Empty)', (t) => {
	t.plan(3);

	const serialized = serialize(new Set());
	const deserialized = deserialize(serialized) as Set<any>;
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Set);
	t.equal(deserialized.size, 0);
});

test('Deserialize Set', (t) => {
	t.plan(4);

	const serialized = serialize(new Set([null]));
	const deserialized = deserialize(serialized) as Set<any>;
	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Set);
	t.equal(deserialized.size, 1);
	t.equal(deserialized.values().next().value, null);
});

test('Deserialize Set (Circular)', (t) => {
	t.plan(8);

	const set = new Set();
	set.add(new Set());
	set.add(set);
	const serialized = serialize(set);
	const deserialized = deserialize(serialized) as Set<any>;
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

test('Deserialize Multiple (Circular)', (t) => {
	t.plan(16);

	const obj = { map: null, set: null, array: [] };
	obj.map = new Map([[1, obj]]);
	obj.set = new Set([obj]);
	obj.array.push(obj);
	const serialized = serialize(obj);
	const deserialized = deserialize(serialized) as Record<any, any>;

	t.equal(typeof deserialized, 'object');
	t.true(deserialized instanceof Object);
	t.equal(Object.keys(deserialized).length, 3);
	t.true('map' in deserialized);
	t.true('set' in deserialized);
	t.true('array' in deserialized);

	t.true(deserialized.map instanceof Map);
	t.equal(deserialized.map.size, 1);
	t.equal(deserialized.map.keys().next().value, 1);
	t.equal(deserialized.map.values().next().value, deserialized);

	t.true(deserialized.set instanceof Set);
	t.equal(deserialized.set.size, 1);
	t.equal(deserialized.set.keys().next().value, deserialized);

	t.true(Array.isArray(deserialized.array));
	t.equal(deserialized.array.length, 1);
	t.equal(deserialized.array[0], deserialized);
});

// TODO: Rest of tests
