import { TypedArray, BinaryTokens } from './constants';

export namespace RegExps {
	const g = 1 << 0;
	const i = 1 << 1;
	const m = 1 << 2;
	const y = 1 << 3;
	const u = 1 << 4;
	const s = 1 << 5;

	export function flagsAsInteger(regExp: RegExp) {
		return (regExp.global ? g : 0)
			| (regExp.ignoreCase ? i : 0)
			| (regExp.multiline ? m : 0)
			| (regExp.sticky ? y : 0)
			| (regExp.unicode ? u : 0)
			| (regExp.dotAll ? s : 0);
	}

	export function flagsFromInteger(integer: number) {
		let ret = '';
		if (integer & g) ret += 'g';
		if (integer & i) ret += 'i';
		if (integer & m) ret += 'm';
		if (integer & y) ret += 'y';
		if (integer & u) ret += 'u';
		if (integer & s) ret += 's';
		return ret;
	}
}

export namespace BigIntegers {
	export const SUPPORTED = typeof BigInt === 'function';
	/* istanbul ignore next: This is environment-specific, unused when unsupported */
	export const ZERO = SUPPORTED ? BigInt(0) : null;
	/* istanbul ignore next: This is environment-specific, unused when unsupported */
	export const ONE = SUPPORTED ? BigInt(1) : null;
	/* istanbul ignore next: This is environment-specific, unused when unsupported */
	export const EIGHT = SUPPORTED ? BigInt(8) : null;
	/* istanbul ignore next: This is environment-specific, unused when unsupported */
	export const BYTE = SUPPORTED ? BigInt(0xFF) : null;
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

	/* istanbul ignore next: This is environment-specific, unused when unsupported */
	if (typeof BigInt64Array === 'function') constructors.push(BigInt64Array);
	/* istanbul ignore next: This is environment-specific, unused when unsupported */
	if (typeof BigUint64Array === 'function') constructors.push(BigUint64Array);

	export const typedArrayTags = new Map(constructors.map(typedArray =>
		// @ts-ignore 7015
		[Object.prototype.toString.call(new typedArray(new ArrayBuffer(0))), BinaryTokens[typedArray.name]] as [string, BinaryTokens]));

	export const typedArrayTagToConstructor = new Map(constructors.map(typedArray =>
		// @ts-ignore 7015
		[BinaryTokens[typedArray.name], typedArray] as unknown as [BinaryTokens, { new <T extends TypedArray>(...args: any): T }]));
}
