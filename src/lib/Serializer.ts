import { BinaryPrimitives, BinaryTokens, TypedArray } from './util/constants';
import { Numbers, BigIntegers, RegExps, TypedArrays } from './util/util';
import { TextEncoder } from 'util';

// Immutable
const MIN_INT32 = -(2 ** 31);
const MAX_INT32 = (2 ** 31) - 1;
const NULL_TERMINATOR = 0x00;

// Mutable
const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(float64Array.buffer);

export interface OnUnsupported {
	(value: unknown): unknown;
}

export class Serializer {

	public onUnsupported: OnUnsupported | null;
	private _buffer: Uint8Array | null = new Uint8Array(16);
	private _offset = 0;
	private _objectIDs = new Map() as Map<Record<any, any>, number>;
	private _data: any;
	private _handlingUnsupported = false;

	public constructor(data: any, onUnsupported: OnUnsupported | null = null) {
		this._data = data;
		this.onUnsupported = onUnsupported;
	}

	public process() {
		this.parse(this._data);
		const temp = this._buffer!.subarray(0, this._offset);

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
		const sign = value >= BigIntegers.ZERO! ? 0 : 1;
		this.ensureAlloc(5);
		this.write8(sign ? BinaryTokens.NBigInt : BinaryTokens.PBigInt);

		const headerOffset = this._offset;
		this._offset += 4;

		let unsignedBigInt = sign === 1 ? -value : value;
		let byteCount = 0;
		while (unsignedBigInt > 0) {
			++byteCount;
			this.write8(Number(unsignedBigInt & BigIntegers.BYTE!));
			unsignedBigInt >>= BigIntegers.EIGHT!;
		}

		this.write32At(byteCount, headerOffset);
	}

	private parseBoolean(value: boolean) {
		this.write8(BinaryTokens.Boolean);
		this.write8(value ? 1 : 0);
	}

	private parseNumber(value: number) {
		const type = this.getNumberType(value);
		this.write8(type);
		switch (type) {
			case BinaryTokens.NByte: this.write8(-value);
				break;
			case BinaryTokens.PByte: this.write8(value);
				break;
			case BinaryTokens.NInt32: this.write32(-value);
				break;
			case BinaryTokens.PInt32: this.write32(value);
				break;
			case BinaryTokens.NFloat64: this.writeF64(-value);
				break;
			case BinaryTokens.PFloat64: this.writeF64(value);
				break;
			default:
				throw new Error(`Unreachable code. Got unexpected integer type ${type}`);
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
			// eslint-disable-next-line @typescript-eslint/ban-types
			case '[object String]': return this.parseValueObjectString(value as String);
			// eslint-disable-next-line @typescript-eslint/ban-types
			case '[object Boolean]': return this.parseValueObjectBoolean(value as Boolean);
			// eslint-disable-next-line @typescript-eslint/ban-types
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
		this.write8(BinaryTokens.String);
		this.writeValueString(value);
	}

	private parseUndefined() {
		this.write8(BinaryTokens.Undefined);
	}

	private parseValueNull() {
		this.write8(BinaryTokens.Null);
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private parseValueObjectString(value: String) {
		this.write8(BinaryTokens.StringObject);
		this.writeValueString(value.valueOf());
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private parseValueObjectBoolean(value: Boolean) {
		this.write8(BinaryTokens.BooleanObject);
		this.write8(value.valueOf() ? 1 : 0);
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private parseValueObjectNumber(value: Number) {
		this.write8(BinaryTokens.NumberObject);
		this.writeF64(value.valueOf());
	}

	private parseValueObjectDate(value: Date) {
		this.write8(BinaryTokens.Date);
		this.writeF64(value.valueOf());
	}

	private parseValueObjectRegExp(value: RegExp) {
		this.write8(BinaryTokens.RegExp);
		this.writeValueString(value.source);
		this.write8(RegExps.flagsAsInteger(value));
	}

	private parseValueObjectLiteral(value: Record<any, any>) {
		const keys = Object.keys(value);
		if (keys.length === 0) {
			return this.write8(BinaryTokens.EmptyObject);
		}

		this.write8(BinaryTokens.Object);
		for (const entryKey of keys) {
			this.parse(entryKey);
			this.parse(value[entryKey]);
		}

		this.write8(NULL_TERMINATOR);
	}

	private parseValueObjectMap(value: Map<unknown, unknown>) {
		if (value.size === 0) {
			return this.write8(BinaryTokens.EmptyMap);
		}

		this.write8(BinaryTokens.Map);
		for (const [entryKey, entryValue] of value.entries()) {
			this.parse(entryKey);
			this.parse(entryValue);
		}

		this.write8(NULL_TERMINATOR);
	}

	private parseValueObjectSet(value: Set<unknown>) {
		if (value.size === 0) {
			return this.write8(BinaryTokens.EmptySet);
		}

		this.write8(BinaryTokens.Set);
		for (const entryValue of value) {
			this.parse(entryValue);
		}

		this.write8(NULL_TERMINATOR);
	}

	private parseValueObjectArrayBuffer(value: ArrayBuffer) {
		this.write8(BinaryTokens.ArrayBuffer);

		const uint8Array = new Uint8Array(value);
		this.write32(uint8Array.length);
		this.write(uint8Array);
	}

	private parseValueObjectWeakMap() {
		this.write8(BinaryTokens.WeakMap);
	}

	private parseValueObjectWeakSet() {
		this.write8(BinaryTokens.WeakSet);
	}

	private parseValueObjectFallback(value: object, tag: string) {
		const typedArrayTag = TypedArrays.typedArrayTags.get(tag);
		if (typedArrayTag) this.writeValueTypedArray(value as TypedArray, typedArrayTag);
		else this.parseValueObjectLiteral(value);
	}

	private parseValueReference(value: number) {
		this.write8(BinaryTokens.ObjectReference);
		this.write32(value);
	}

	private parseValueArray(value: Array<unknown>) {
		if (value.length === 0) {
			return this.write8(BinaryTokens.EmptyArray);
		}

		this.ensureAlloc(2);
		this.write8(BinaryTokens.Array);

		for (let i = 0, n = value.length; i < n; i++) {
			if (i in value) {
				this.parse(value[i]);
			} else {
				this.write8(BinaryTokens.Hole);
			}
		}

		this.write8(NULL_TERMINATOR);
	}

	private writeValueTypedArray(value: TypedArray, tag: BinaryTokens) {
		this.write8(tag);
		this.write32(value.byteLength);

		if (tag !== BinaryTokens.Uint8Array) {
			value = new Uint8Array(value.buffer);
		}

		this.write(value as Uint8Array);
	}

	private write(value: Uint8Array) {
		this.ensureAlloc(value.byteLength);
		this._buffer!.set(value, this._offset);
		this._offset += value.byteLength;
	}

	private write8(value: number) {
		this.ensureAlloc(1);
		this._buffer![this._offset++] = value;
	}

	private write32(value: number) {
		this.ensureAlloc(4);
		this.write32At(value, this._offset);
		this._offset += 4;
	}

	private write32At(value: number, offset: number) {
		this._buffer![offset + 3] = value;
		value >>>= 8;
		this._buffer![offset + 2] = value;
		value >>>= 8;
		this._buffer![offset + 1] = value;
		value >>>= 8;
		this._buffer![offset] = value;
	}

	private writeF64(value: number) {
		float64Array[0] = value;
		this.write(uInt8Float64Array);
	}

	private writeValueString(value: string) {
		const serialized = Serializer._textEncoder.encode(value);

		this.write(serialized);
		this.write8(NULL_TERMINATOR);
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

	private expandBuffer(length: number) {
		if (this._buffer!.length < length) {
			const old = this._buffer;
			this._buffer = new Uint8Array(Numbers.nextPowerOfTwo(length));
			this._buffer.set(old!);
		}
	}

	private static _textEncoder = new TextEncoder();

}
