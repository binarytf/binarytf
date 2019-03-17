import { TypedArray, BinaryTokens } from './constants';

export namespace RegExps {
	const g = 1 << 0;
	const i = 1 << 1;
	const m = 1 << 2;
	const y = 1 << 3;
	const u = 1 << 4;

	export function flagsAsInteger(regExp: RegExp) {
		return (regExp.global ? g : 0) |
			(regExp.ignoreCase ? i : 0) |
			(regExp.multiline ? m : 0) |
			(regExp.sticky ? y : 0) |
			(regExp.unicode ? u : 0);
	}

	export function flagsFromInteger(integer: number) {
		let ret = '';
		if (integer & g) ret += 'g';
		if (integer & i) ret += 'i';
		if (integer & m) ret += 'm';
		if (integer & y) ret += 'y';
		if (integer & u) ret += 'u';
		return ret;
	}
}

export namespace BigIntegers {
	export const SUPPORTED = typeof BigInt === 'function';
	export const ZERO = SUPPORTED ? BigInt(0) : null;
	export const ONE = SUPPORTED ? BigInt(1) : null;
	export const EIGHT = SUPPORTED ? BigInt(8) : null;
	export const BYTE = SUPPORTED ? BigInt(0xFF) : null;

	export function nextPowerOfTwo(n: bigint) {
		return n > 0 && (n & (n - ONE)) === ZERO ? Number(n) : 1 << bitCount(n);
	}

	export function bitCount(n: bigint) {
		let count = 0;
		while (n !== ZERO) {
			n >>= ONE;
			count += 1;
		}

		return count;
	}

	export function byteCount(n: bigint) {
		return Math.ceil(bitCount(n) / 8);
	}
}

export namespace Numbers {
	export function nextPowerOfTwo(n: number) {
		return Math.pow(2, Math.ceil(Math.log2(n)));
	}
}

export namespace TypedArrays {

	export const constructors = [Int8Array, Uint8Array, Uint8ClampedArray,
		Int16Array, Uint16Array, Int32Array, Uint32Array,
		Float32Array, Float64Array, DataView] as { new<T extends TypedArray>(...args: any): T }[];

	if (typeof BigInt64Array === 'function') constructors.push(BigInt64Array);
	if (typeof BigUint64Array === 'function') constructors.push(BigUint64Array);

	export const typedArrayTags = new Map(constructors.map(typedArray =>
		[Object.prototype.toString.call(new typedArray(new ArrayBuffer(0))), BinaryTokens[typedArray.name]] as [string, BinaryTokens]
	));

	export const typedArrayTagToConstructor = new Map(constructors.map(typedArray =>
		[BinaryTokens[typedArray.name], typedArray] as unknown as [BinaryTokens, { new <T extends TypedArray>(...args: any): T }]
	));
}
