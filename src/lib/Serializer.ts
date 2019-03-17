import { BinaryPrimitives, BinaryTokens, TypedArray } from './util/constants';
import { Numbers, BigIntegers, RegExps, TypedArrays } from './util/util';
import { TextEncoder } from 'util';

// Immutable
const MIN_INT32 = -(2 ** 31);
const MAX_INT32 = (2 ** 31) - 1;

// Mutable
const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(float64Array.buffer);

export class Serializer {
	public onUnsupported: (value: unknown) => unknown;
	private _buffer: Uint8Array = new Uint8Array(16);
	private _offset = 0;
	private _objectIDs = new Map() as Map<Record<any, any>, number>;
	private _data: any;
	private _handlingUnsupported = false;
	private static _textEncoder = new TextEncoder();

	public constructor(data: any, onUnsupported: (value: unknown) => unknown = null) {
		this._data = data;
		this.onUnsupported = onUnsupported;
	}

	public process() {
		this.parse(this._data);
		const temp = this._buffer.subarray(0, this._offset);

		this._data = null;
		this._offset = 0;
		this._objectIDs.clear();
		this._buffer = null;
		return temp;
	}

	public parse(value: any, hint = typeof value) {
		switch (hint) {
			case BinaryPrimitives.BigInt: return this.parseBigInt(value);
			case BinaryPrimitives.Boolean: return this.parseBoolean(value);
			case BinaryPrimitives.Number: return this.parseNumber(value);
			case BinaryPrimitives.Object: return this.parseObject(value);
			case BinaryPrimitives.String: return this.parseString(value);
			case BinaryPrimitives.Undefined: return this.parseUndefined();
			default: return this.handleUnsupported(value);
		}
	}

	protected handleUnsupported(value: unknown) {
		// If there's an onUnsupported handler, try to call it
		if (this.onUnsupported) {
			// If the serializer was handling an unsupported type, abort the serialization
			// as it's most likely an error in the return type of the handler.
			if (this._handlingUnsupported) {
				throw new TypeError(`Failed to handle unsupported type, aborting serialization.`);
			}

			// Set the serializer to handling unsupported, parse, and once it's done
			// serializing the output of unSupported, set it back to false.
			this._handlingUnsupported = true;
			this.parse(this.onUnsupported(value));
			this._handlingUnsupported = false;
			return;
		}

		// If no handler is available, throw TypeError
		throw new TypeError(`Unsupported type '${typeof value}'`);
	}

	private parseBigInt(value: bigint) {
		const sign = value >= BigIntegers.ZERO ? 0 : 1;
		this.ensureAlloc(5);
		this._buffer[this._offset++] = sign ? BinaryTokens.NBigInt : BinaryTokens.PBigInt;

		const headerOffset = this._offset;
		this._offset += 4;

		let unsignedBigInt = sign === 1 ? -value : value;
		let byteCount = 0;
		while (unsignedBigInt > 0) {
			byteCount++;
			this.ensureAlloc(1);
			this._buffer[this._offset++] = Number(unsignedBigInt & BigIntegers.BYTE);
			unsignedBigInt >>= BigIntegers.EIGHT;
		}

		this.writeUint32(headerOffset, byteCount);
	}

	private parseBoolean(value: boolean) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.Boolean;
		this.writeValueBoolean(value);
	}

	private parseNumber(value: number) {
		const type = this.getNumberType(value);
		this.ensureAlloc(1);
		this._buffer[this._offset++] = type;
		switch (type) {
			case BinaryTokens.NByte: this.writeValueByte(-value); break;
			case BinaryTokens.PByte: this.writeValueByte(value); break;
			case BinaryTokens.NInt32: this.writeValueInt32(-value); break;
			case BinaryTokens.PInt32: this.writeValueInt32(value); break;
			case BinaryTokens.NFloat64: this.writeValueFloat64(-value); break;
			case BinaryTokens.PFloat64: this.writeValueFloat64(value); break;
			default: throw new Error(`Unreachable code. Got unexpected integer type ${type}`);
		}
	}

	private parseObject(value: object) {
		if (value === null) return this.parseValueNull();

		// Circular reference detection
		const id = this._objectIDs.get(value);
		if (typeof id === 'number') return this.parseValueReference(id);

		// Set this object to the reference list
		this._objectIDs.set(value, this._objectIDs.size);

		// If it's an array, parse it
		if (Array.isArray(value)) return this.parseValueArray(value);

		// We're doing this because it's safer for the context where you
		// extend the classes.
		const tag = Object.prototype.toString.call(value);
		switch (tag) {
			case '[object String]': return this.parseValueObjectString(value as String);
			case '[object Boolean]': return this.parseValueObjectBoolean(value as Boolean);
			case '[object Number]': return this.parseValueObjectNumber(value as Number);
			case '[object Date]': return this.parseValueObjectDate(value as Date);
			case '[object RegExp]': return this.parseValueObjectRegExp(value as RegExp);
			case '[object Object]': return this.parseValueObjectLiteral(value);
			case '[object Map]': return this.parseValueObjectMap(value as Map<unknown, unknown>);
			case '[object Set]': return this.parseValueObjectSet(value as Set<unknown>);
			case '[object ArrayBuffer]': return this.parseValueObjectArrayBuffer(value as ArrayBuffer);
			case '[object WeakMap]': return this.parseValueObjectWeakMap();
			case '[object WeakSet]': return this.parseValueObjectWeakSet();
			case '[object Promise]': return this.handleUnsupported(value);
			default: return this.parseValueObjectFallback(value, tag);
		}
	}

	private parseString(value: string) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.String;
		this.writeValueString(value);
	}

	private parseUndefined() {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.Undefined;
	}

	private parseValueNull() {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.Null;
	}

	private parseValueObjectString(value: String) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.StringObject;
		this.writeValueString(value.valueOf());
	}

	private parseValueObjectBoolean(value: Boolean) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.BooleanObject;
		this.writeValueBoolean(value.valueOf());
	}

	private parseValueObjectNumber(value: Number) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.NumberObject;
		this.writeValueFloat64(value.valueOf());
	}

	private parseValueObjectDate(value: Date) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.Date;
		this.writeValueFloat64(value.valueOf());
	}

	private parseValueObjectRegExp(value: RegExp) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.RegExp;
		this.writeValueString(value.source);
		this.writeValueByte(RegExps.flagsAsInteger(value));
	}

	private parseValueObjectLiteral(value: Record<any, any>) {
		const keys = Object.keys(value);
		if (keys.length === 0) {
			this.ensureAlloc(1);
			this._buffer[this._offset++] = BinaryTokens.EmptyObject;
			return;
		}

		this.ensureAlloc(5);
		this._buffer[this._offset++] = BinaryTokens.Object;
		this.writeUint32(keys.length, this._offset);
		this._offset += 4;

		for (const entryKey of keys) {
			this.parse(entryKey);
			this.parse(value[entryKey]);
		}
	}

	private parseValueObjectMap(value: Map<unknown, unknown>) {
		if (value.size === 0) {
			this.ensureAlloc(1);
			this._buffer[this._offset++] = BinaryTokens.EmptyMap;
			return;
		}

		this.ensureAlloc(5);
		this._buffer[this._offset++] = BinaryTokens.Map;
		this.writeUint32(value.size, this._offset);
		this._offset += 4;

		for (const [entryKey, entryValue] of value.entries()) {
			this.parse(entryKey);
			this.parse(entryValue);
		}
	}

	private parseValueObjectSet(value: Set<unknown>) {
		if (value.size === 0) {
			this.ensureAlloc(1);
			this._buffer[this._offset++] = BinaryTokens.EmptySet;
			return;
		}

		this.ensureAlloc(5);
		this._buffer[this._offset++] = BinaryTokens.Set;
		this.writeUint32(value.size, this._offset);
		this._offset += 4;

		for (const entryValue of value) {
			this.parse(entryValue);
		}
	}

	private parseValueObjectArrayBuffer(value: ArrayBuffer) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.ArrayBuffer;

		// We cannot read an ArrayBuffer, so we create an Uint8Array.
		const uint8Array = new Uint8Array(value);
		this.ensureAlloc(4 + uint8Array.length);

		// Write the byte length
		this.writeUint32(uint8Array.length, this._offset);
		this._offset += 4;

		// Write the data
		this._buffer.set(uint8Array, this._offset);
		this._offset += uint8Array.length;
	}

	private parseValueObjectWeakMap() {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.WeakMap;
	}

	private parseValueObjectWeakSet() {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = BinaryTokens.WeakSet;
	}

	private parseValueObjectFallback(value: object, tag: string) {
		const typedArrayTag = TypedArrays.typedArrayTags.get(tag);
		if (typedArrayTag) this.writeValueTypedArray(value as TypedArray, typedArrayTag);
		else this.parseValueObjectLiteral(value);
	}

	private parseValueReference(value: number) {
		this.ensureAlloc(5);
		this._buffer[this._offset++] = BinaryTokens.ObjectReference;
		this.writeUint32(value, this._offset);
		this._offset += 4;
	}

	private parseValueArray(value: Array<unknown>) {
		if (value.length === 0) {
			this.ensureAlloc(1);
			this._buffer[this._offset++] = BinaryTokens.EmptyArray;
			return;
		}

		this.ensureAlloc(5);
		this._buffer[this._offset++] = BinaryTokens.Array;
		this.writeUint32(value.length, this._offset);
		this._offset += 4;

		for (let i = 0, n = value.length; i < n; i++) {
			if (i in value) {
				this.parse(value[i]);
			} else {
				this.ensureAlloc(1);
				this._buffer[this._offset++] = BinaryTokens.Hole;
			}
		}
	}

	private writeValueTypedArray(value: TypedArray, tag: BinaryTokens) {
		// Allocate 5 + byteLength to the internal buffer and assign the tag
		this.ensureAlloc(5 + value.byteLength);
		this._buffer[this._offset++] = tag;

		// Write the array length in the next 4 bytes
		this.writeUint32(value.byteLength, this._offset);
		this._offset += 4;

		if (tag !== BinaryTokens.Uint8Array) {
			value = new Uint8Array(value.buffer);
		}

		this._buffer.set(value, this._offset);
		this._offset += value.byteLength;
	}

	private writeValueByte(value: number) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = value;
	}

	private writeValueInt32(value: number) {
		this.ensureAlloc(4);
		this.writeUint32(value, this._offset);
		this._offset += 4;
	}

	private writeValueFloat64(value: number) {
		this.ensureAlloc(8);
		this.writeFloat64(value, this._offset);
		this._offset += 8;
	}

	private writeValueBoolean(value: boolean) {
		this.ensureAlloc(1);
		this._buffer[this._offset++] = value ? 1 : 0;
	}

	private writeValueString(value: string) {
		const serialized = Serializer._textEncoder.encode(value);
		this.ensureAlloc(4 + serialized.length);

		this.writeUint32(serialized.length, this._offset);
		this._offset += 4;

		this._buffer.set(serialized, this._offset);
		this._offset += serialized.length;
	}

	private getNumberType(value: number) {
		const sign = value >= 0 ? 0 : 1;
		if (value % 1 === 0) {
			// Byte (N | P)
			if (value >= -0xFF && value <= 0xFF) return sign ? BinaryTokens.NByte : BinaryTokens.PByte;
			// Int32 (N | P)
			if (value >= MIN_INT32 && value <= MAX_INT32) return sign ? BinaryTokens.NInt32 : BinaryTokens.PInt32;
			// Fallback to float
		}
		// Float64
		return sign ? BinaryTokens.NFloat64 : BinaryTokens.PFloat64;
	}

	private ensureAlloc(amount: number) {
		this.expandBuffer(this._offset + amount);
	}

	private expandBuffer(length) {
		if (this._buffer.length < length) {
			const old = this._buffer;
			this._buffer = new Uint8Array(Numbers.nextPowerOfTwo(length));
			this._buffer.set(old);
		}
	}

	private writeUint32(value: number, offset: number) {
		this._buffer[offset + 3] = value;
		value >>>= 8;
		this._buffer[offset + 2] = value;
		value >>>= 8;
		this._buffer[offset + 1] = value;
		value >>>= 8;
		this._buffer[offset] = value;
	}

	private writeFloat64(value: number, offset: number) {
		float64Array[0] = value;
		this._buffer.set(uInt8Float64Array, offset);
	}

}
