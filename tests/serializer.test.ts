import { serialize } from '../src/index';
import { SerializerError, SerializerReason } from '../src/lib/errors/SerializerError';

describe('Serializer', () => {
	test('Serialize Null', () => {
		expect.assertions(1);

		const serialized = serialize(null);
		// 1 (TYPE), inferred value
		expect(serialized.length).toBe(1);
	});

	if (typeof BigInt === 'function') {
		test('Serialize PBigInt', () => {
			expect.assertions(1);

			const serialized = serialize(BigInt('4'));
			// 1 (TYPE) + 4 (LENGTH) + 1 (BYTE)
			expect(serialized.length).toBe(6);
		});

		test('Serialize PBigInt', () => {
			expect.assertions(1);

			const serialized = serialize(-BigInt('4'));
			// 1 (TYPE) + 4 (LENGTH) + 1 (BYTE)
			expect(serialized.length).toBe(6);
		});
	}

	test('Serialize Boolean', () => {
		expect.assertions(1);

		const serialized = serialize(false);
		// 1 (TYPE) + 1 (BYTE)
		expect(serialized.length).toBe(2);
	});

	test('Serialize UTF8', () => {
		expect.assertions(1);

		const serialized = serialize('Hello');
		// 1 (TYPE) + 5 (BYTE) + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(7);
	});

	test('Serialize UTF16', () => {
		expect.assertions(1);

		const serialized = serialize('⭐');
		// 1 (TYPE) + 3 (BYTE) + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(5);
	});

	test('Serialize Undefined', () => {
		expect.assertions(1);

		const serialized = serialize(undefined);
		// 1 (TYPE), inferred value
		expect(serialized.length).toBe(1);
	});

	test('Serialize UnsignedByte', () => {
		expect.assertions(1);

		const serialized = serialize(0b1111_1111);
		// 1 (TYPE) + 1 (BYTE)
		expect(serialized.length).toBe(2);
	});

	test('Serialize SignedByte', () => {
		expect.assertions(1);

		const serialized = serialize(-0b0111_1111);
		// 1 (TYPE) + 1 (BYTE)
		expect(serialized.length).toBe(2);
	});

	test('Serialize UnsignedInt32', () => {
		expect.assertions(1);

		const serialized = serialize(0xffff);
		// 1 (TYPE) + 4 (BYTE)
		expect(serialized.length).toBe(5);
	});

	test('Serialize SignedInt32', () => {
		expect.assertions(1);

		const serialized = serialize(0xffff * -1);
		// 1 (TYPE) + 4 (BYTE)
		expect(serialized.length).toBe(5);
	});

	test('Serialize PFloat64', () => {
		expect.assertions(1);

		const serialized = serialize(0xfffffffff - 0.1);
		// 1 (TYPE) + 8 (BYTE)
		expect(serialized.length).toBe(9);
	});

	test('Serialize NFloat64', () => {
		expect.assertions(1);

		const serialized = serialize((0xffffffff - 0.1) * -1);
		// 1 (TYPE) + 8 (BYTE)
		expect(serialized.length).toBe(9);
	});

	test('Serialize NaN', () => {
		expect.assertions(1);

		const serialized = serialize(NaN);
		// 1 (TYPE) + 8 (BYTE)
		expect(serialized.length).toBe(9);
	});

	test('Serialize Infinity', () => {
		expect.assertions(1);

		const serialized = serialize(Infinity);
		// 1 (TYPE) + 8 (BYTE)
		expect(serialized.length).toBe(9);
	});

	test('Serialize Unsafe Float', () => {
		expect.assertions(1);

		const serialized = serialize(Number.MAX_VALUE);
		// 1 (TYPE) + 8 (BYTE)
		expect(serialized.length).toBe(9);
	});

	test('Serialize Array (Empty)', () => {
		expect.assertions(1);

		const serialized = serialize([]);
		// 1 (TYPE)
		expect(serialized.length).toBe(1);
	});

	test('Serialize Array (UnsignedInt32)', () => {
		expect.assertions(1);

		const serialized = serialize([4]);
		// 1 (TYPE) + [1 (TYPE) + 1 (BYTE)] + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(4);
	});

	test('Serialize Array (Holey)', () => {
		expect.assertions(1);

		// eslint-disable-next-line no-sparse-arrays, array-bracket-spacing
		const serialized = serialize([,]);
		// 1 (TYPE) + 1 (TYPE), value inferred + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(3);
	});

	test('Serialize Object (Empty)', () => {
		expect.assertions(1);

		const serialized = serialize({});
		// 1 (TYPE)
		expect(serialized.length).toBe(1);
	});

	test('Serialize Object', () => {
		expect.assertions(1);

		const serialized = serialize({ a: 12 });
		// 1 (TYPE) + [1 (TYPE) + 1 (BYTE) + 1 (NULL TERMINATOR)] + [1 (TYPE) + 1 (BYTE)] + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(7);
	});

	test('Serialize Object Fallback (Math)', () => {
		expect.assertions(1);

		const serialized = serialize(Math);
		// 1 (TYPE)
		expect(serialized.length).toBe(1);
	});

	test('Serialize Object (Circular)', () => {
		expect.assertions(1);

		interface Test {
			a: Test | null;
		}
		const object: Test = { a: null };
		object.a = object;
		const serialized = serialize(object);
		// 1 (TYPE) + 1 (TYPE) + [1 (BYTE) + 1 (NULL TERMINATOR)] + [1 (TYPE) + 4 (BYTE)] + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(10);
	});

	test('Serialize Date', () => {
		expect.assertions(1);

		const serialized = serialize(new Date());
		// 1 (TYPE) + 8 (BYTE)
		expect(serialized.length).toBe(9);
	});

	test('Serialize Boolean Object', () => {
		expect.assertions(1);

		// eslint-disable-next-line no-new-wrappers
		const serialized = serialize(new Boolean(true));
		// 1 (TYPE) + 1 (BYTE)
		expect(serialized.length).toBe(2);
	});

	test('Serialize Number Object', () => {
		expect.assertions(1);

		// eslint-disable-next-line no-new-wrappers
		const serialized = serialize(new Number(12));
		// 1 (TYPE) + 8 (BYTE)
		expect(serialized.length).toBe(9);
	});

	test('Serialize String Object', () => {
		expect.assertions(1);

		// eslint-disable-next-line no-new-wrappers
		const serialized = serialize(new String('Hello'));
		// 1 (TYPE) + 5 (BYTE) + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(7);
	});

	test('Serialize RegExp', () => {
		expect.assertions(1);

		const serialized = serialize(/ab/g);
		// 1 (TYPE) + 2 (BYTE) + 1 (NULL TERMINATOR) + 1 (BYTE)
		expect(serialized.length).toBe(5);
	});

	test('Serialize Map (Empty)', () => {
		expect.assertions(1);

		const serialized = serialize(new Map());
		// 1 (TYPE)
		expect(serialized.length).toBe(1);
	});

	test('Serialize Map', () => {
		expect.assertions(1);

		const serialized = serialize(new Map([[1, null]]));
		// 1 (TYPE) + [1 (TYPE) + 1 (BYTE)] + [1 (TYPE)] + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(5);
	});

	test('Serialize Set (Empty)', () => {
		expect.assertions(1);

		const serialized = serialize(new Set());
		// 1 (TYPE)
		expect(serialized.length).toBe(1);
	});

	test('Serialize Set', () => {
		expect.assertions(1);

		const serialized = serialize(new Set([null]));
		// 1 (TYPE) + [1 (TYPE)] + 1 (NULL TERMINATOR)
		expect(serialized.length).toBe(3);
	});

	test('Serialize ArrayBuffer', () => {
		expect.assertions(1);

		const buffer = new ArrayBuffer(4);
		const serialized = serialize(buffer);
		// 1 (TYPE) + 4 (LENGTH) + 4 (BYTE)
		expect(serialized.length).toBe(9);
	});

	// TODO: Add TypedArray tests

	test('Serialize WeakMap', () => {
		expect.assertions(1);

		const serialized = serialize(new WeakMap());
		// 1 (TYPE)
		expect(serialized.length).toBe(1);
	});

	test('Serialize WeakSet', () => {
		expect.assertions(1);

		const serialized = serialize(new WeakSet());
		// 1 (TYPE)
		expect(serialized.length).toBe(1);
	});

	test('Serialize Unsupported Types', () => {
		expect.assertions(1);

		const serialized = serialize(
			() => {},
			() => null
		);
		// 1 (TYPE)
		expect(serialized.length).toBe(1);
	});

	test('Serialize Unsupported Types No-Fallback (Invalid)', () => {
		expect.assertions(2);
		try {
			serialize(() => {});
		} catch (error) {
			expect(error instanceof SerializerError).toBeTruthy();
			expect((error as SerializerError).kind).toBe(SerializerReason.UnsupportedType);
		}
	});

	test('Serialize Unsupported Object Types (Invalid)', () => {
		expect.assertions(2);
		try {
			serialize(Promise.resolve());
		} catch (error) {
			expect(error instanceof SerializerError).toBeTruthy();
			expect((error as SerializerError).kind).toBe(SerializerReason.UnsupportedType);
		}
	});

	test('Serialize Unsupported Serialized Types (Invalid)', () => {
		expect.assertions(2);
		try {
			serialize(
				() => {},
				() => Symbol('')
			);
		} catch (error) {
			expect(error instanceof SerializerError).toBeTruthy();
			expect((error as SerializerError).kind).toBe(SerializerReason.UnsupportedSerializedType);
		}
	});

	test('Serialize String with Null Pointer (Invalid)', () => {
		expect.assertions(2);
		try {
			serialize('Hello\0 World');
		} catch (error) {
			expect(error instanceof SerializerError).toBeTruthy();
			expect((error as SerializerError).kind).toBe(SerializerReason.UnexpectedNullValue);
		}
	});
});
