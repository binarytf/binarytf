import * as test from 'tape';
import { serialize } from '../index';
import { SerializerError, SerializerReason } from '../lib/errors/SerializerError';

test('Serialize Null', t => {
	t.plan(1);

	const serialized = serialize(null);
	// 1 (TYPE), inferred value
	t.equal(serialized.length, 1);
});

if (typeof BigInt === 'function') {
	test('Serialize PBigInt', t => {
		t.plan(1);

		const serialized = serialize(BigInt('4'));
		// 1 (TYPE) + 4 (LENGTH) + 1 (BYTE)
		t.equal(serialized.length, 6);
	});

	test('Serialize PBigInt', t => {
		t.plan(1);

		const serialized = serialize(-BigInt('4'));
		// 1 (TYPE) + 4 (LENGTH) + 1 (BYTE)
		t.equal(serialized.length, 6);
	});
}

test('Serialize Boolean', t => {
	t.plan(1);

	const serialized = serialize(false);
	// 1 (TYPE) + 1 (BYTE)
	t.equal(serialized.length, 2);
});

test('Serialize UTF8', t => {
	t.plan(1);

	const serialized = serialize('Hello');
	// 1 (TYPE) + 5 (BYTE) + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 7);
});

test('Serialize UTF16', t => {
	t.plan(1);

	const serialized = serialize('⭐');
	// 1 (TYPE) + 3 (BYTE) + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 5);
});

test('Serialize Undefined', t => {
	t.plan(1);

	const serialized = serialize(undefined);
	// 1 (TYPE), inferred value
	t.equal(serialized.length, 1);
});

test('Serialize PByte', t => {
	t.plan(1);

	const serialized = serialize(0xFF);
	// 1 (TYPE) + 1 (BYTE)
	t.equal(serialized.length, 2);
});

test('Serialize NByte', t => {
	t.plan(1);

	const serialized = serialize(0xFF * -1);
	// 1 (TYPE) + 1 (BYTE)
	t.equal(serialized.length, 2);
});

test('Serialize PInt32', t => {
	t.plan(1);

	const serialized = serialize(0xFFFF);
	// 1 (TYPE) + 4 (BYTE)
	t.equal(serialized.length, 5);
});

test('Serialize NInt32', t => {
	t.plan(1);

	const serialized = serialize(0xFFFF * -1);
	// 1 (TYPE) + 4 (BYTE)
	t.equal(serialized.length, 5);
});

test('Serialize PFloat64', t => {
	t.plan(1);

	const serialized = serialize(0xFFFFFFFFF - 0.1);
	// 1 (TYPE) + 8 (BYTE)
	t.equal(serialized.length, 9);
});

test('Serialize NFloat64', t => {
	t.plan(1);

	const serialized = serialize((0xFFFFFFFF - 0.1) * -1);
	// 1 (TYPE) + 8 (BYTE)
	t.equal(serialized.length, 9);
});

test('Serialize NaN', t => {
	t.plan(1);

	const serialized = serialize(NaN);
	// 1 (TYPE) + 8 (BYTE)
	t.equal(serialized.length, 9);
});

test('Serialize Infinity', t => {
	t.plan(1);

	const serialized = serialize(Infinity);
	// 1 (TYPE) + 8 (BYTE)
	t.equal(serialized.length, 9);
});

test('Serialize Unsafe Float', t => {
	t.plan(1);

	const serialized = serialize(Number.MAX_VALUE);
	// 1 (TYPE) + 8 (BYTE)
	t.equal(serialized.length, 9);
});

test('Serialize Array (Empty)', t => {
	t.plan(1);

	const serialized = serialize([]);
	// 1 (TYPE)
	t.equal(serialized.length, 1);
});

test('Serialize Array (PInt32)', t => {
	t.plan(1);

	const serialized = serialize([4]);
	// 1 (TYPE) + [1 (TYPE) + 1 (BYTE)] + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 4);
});

test('Serialize Array (Holey)', t => {
	t.plan(1);

	// eslint-disable-next-line no-sparse-arrays, array-bracket-spacing
	const serialized = serialize([, ]);
	// 1 (TYPE) + 1 (TYPE), value inferred + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 3);
});

test('Serialize Object (Empty)', t => {
	t.plan(1);

	const serialized = serialize({});
	// 1 (TYPE)
	t.equal(serialized.length, 1);
});

test('Serialize Object', t => {
	t.plan(1);

	const serialized = serialize({ a: 12 });
	// 1 (TYPE) + [1 (TYPE) + 1 (BYTE) + 1 (NULL TERMINATOR)] + [1 (TYPE) + 1 (BYTE)] + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 7);
});

test('Serialize Object Fallback (Math)', t => {
	t.plan(1);

	const serialized = serialize(Math);
	// 1 (TYPE)
	t.equal(serialized.length, 1);
});

test('Serialize Object (Circular)', t => {
	t.plan(1);

	interface Test { a: Test | null }
	const object: Test = { a: null };
	object.a = object;
	const serialized = serialize(object);
	// 1 (TYPE) + 1 (TYPE) + [1 (BYTE) + 1 (NULL TERMINATOR)] + [1 (TYPE) + 4 (BYTE)] + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 10);
});

test('Serialize Date', t => {
	t.plan(1);

	const serialized = serialize(new Date());
	// 1 (TYPE) + 8 (BYTE)
	t.equal(serialized.length, 9);
});

test('Serialize Boolean Object', t => {
	t.plan(1);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new Boolean(true));
	// 1 (TYPE) + 1 (BYTE)
	t.equal(serialized.length, 2);
});

test('Serialize Number Object', t => {
	t.plan(1);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new Number(12));
	// 1 (TYPE) + 8 (BYTE)
	t.equal(serialized.length, 9);
});

test('Serialize String Object', t => {
	t.plan(1);

	// eslint-disable-next-line no-new-wrappers
	const serialized = serialize(new String('Hello'));
	// 1 (TYPE) + 5 (BYTE) + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 7);
});

test('Serialize RegExp', t => {
	t.plan(1);

	const serialized = serialize(/ab/g);
	// 1 (TYPE) + 2 (BYTE) + 1 (NULL TERMINATOR) + 1 (BYTE)
	t.equal(serialized.length, 5);
});

test('Serialize Map (Empty)', t => {
	t.plan(1);

	const serialized = serialize(new Map());
	// 1 (TYPE)
	t.equal(serialized.length, 1);
});

test('Serialize Map', t => {
	t.plan(1);

	const serialized = serialize(new Map([[1, null]]));
	// 1 (TYPE) + [1 (TYPE) + 1 (BYTE)] + [1 (TYPE)] + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 5);
});

test('Serialize Set (Empty)', t => {
	t.plan(1);

	const serialized = serialize(new Set());
	// 1 (TYPE)
	t.equal(serialized.length, 1);
});

test('Serialize Set', t => {
	t.plan(1);

	const serialized = serialize(new Set([null]));
	// 1 (TYPE) + [1 (TYPE)] + 1 (NULL TERMINATOR)
	t.equal(serialized.length, 3);
});

test('Serialize ArrayBuffer', t => {
	t.plan(1);

	const buffer = new ArrayBuffer(4);
	const serialized = serialize(buffer);
	// 1 (TYPE) + 4 (LENGTH) + 4 (BYTE)
	t.equal(serialized.length, 9);
});

// TODO: Add TypedArray tests

test('Serialize WeakMap', t => {
	t.plan(1);

	const serialized = serialize(new WeakMap());
	// 1 (TYPE)
	t.equal(serialized.length, 1);
});

test('Serialize WeakSet', t => {
	t.plan(1);

	const serialized = serialize(new WeakSet());
	// 1 (TYPE)
	t.equal(serialized.length, 1);
});

test('Serialize Unsupported Types', t => {
	t.plan(1);

	const serialized = serialize(() => { }, () => null);
	// 1 (TYPE)
	t.equal(serialized.length, 1);
});

test('Serialize Unsupported Types No-Fallback (Invalid)', t => {
	t.plan(2);
	try {
		serialize(() => {});
		t.fail('Serialize should fail.');
	} catch (error) {
		t.true(error instanceof SerializerError);
		t.equal((error as SerializerError).kind, SerializerReason.UnsupportedType);
	}
});

test('Serialize Unsupported Object Types (Invalid)', t => {
	t.plan(2);
	try {
		serialize(Promise.resolve());
		t.fail('Serialize should fail.');
	} catch (error) {
		t.true(error instanceof SerializerError);
		t.equal((error as SerializerError).kind, SerializerReason.UnsupportedType);
	}
});

test('Serialize Unsupported Serialized Types (Invalid)', t => {
	t.plan(2);
	try {
		serialize(() => { }, () => Symbol(''));
		t.fail('Serialize should fail.');
	} catch (error) {
		t.true(error instanceof SerializerError);
		t.equal((error as SerializerError).kind, SerializerReason.UnsupportedSerializedType);
	}
});

test('Serialize String with Null Pointer (Invalid)', t => {
	t.plan(2);
	try {
		serialize('Hello\0 World');
		t.fail('Serialize should fail.');
	} catch (error) {
		t.true(error instanceof SerializerError);
		t.equal((error as SerializerError).kind, SerializerReason.UnexpectedNullValue);
	}
});
