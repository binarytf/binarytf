export enum BinaryTokens {
	Hole,
	Null,
	PBigInt,
	NBigInt,
	Boolean,
	String,
	Undefined,
	PByte,
	NByte,
	PInt32,
	NInt32,
	PFloat64,
	NFloat64,
	Array,
	EmptyArray,
	ObjectReference,
	Date,
	BooleanObject,
	NumberObject,
	StringObject,
	EmptyObject,
	Object,
	RegExp,
	Map,
	EmptyMap,
	Set,
	EmptySet,
	ArrayBuffer,
	Int8Array,
	Uint8Array,
	Uint8ClampedArray,
	Int16Array,
	Uint16Array,
	Int32Array,
	Uint32Array,
	Float32Array,
	Float64Array,
	DataView,
}

export enum BinaryPrimitives {
	BigInt = 'bigint',
	Boolean = 'boolean',
	Number = 'number',
	Object = 'object',
	String = 'string',
	Undefined = 'undefined'
}

export type TypedArray = Uint8Array | Float32Array | Int32Array;
// tslint:disable-next-line: variable-name
export const TypedArray = Object.getPrototypeOf(Int8Array) as TypedArray;
