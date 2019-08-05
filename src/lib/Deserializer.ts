import { TextDecoder } from 'util';
import { BinaryTokens, TypedArray } from './util/constants';
import { BigIntegers, RegExps, TypedArrays } from './util/util';
import { DeserializerError, DeserializerReason } from './errors/DeserializerError';

const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(float64Array.buffer);

export class Deserializer {

	public offset = 0;
	private _buffer: Uint8Array | null;
	private _objectIDs = new Map() as Map<number, Record<any, any>>;

	public constructor(buffer: Uint8Array) {
		this._buffer = buffer;
	}

	private get finished() {
		return this.offset === this._buffer!.length;
	}

	public clean() {
		this._buffer = null;
		this.offset = 0;
		this._objectIDs.clear();
	}

	public read() {
		const type = this.read8();
		switch (type) {
			case BinaryTokens.Null: return null;
			case BinaryTokens.PBigInt: return this.readValueBigInt(false);
			case BinaryTokens.NBigInt: return this.readValueBigInt(true);
			case BinaryTokens.Boolean: return Boolean(this.read8());
			case BinaryTokens.String: return this.readString();
			case BinaryTokens.Undefined: return undefined;
			case BinaryTokens.UnsignedByte: return this.read8();
			case BinaryTokens.SignedByte: return -this.read8();
			case BinaryTokens.UnsignedInt32: return this.read32();
			case BinaryTokens.SignedInt32: return -this.read32();
			case BinaryTokens.UnsignedFloat64: return this.readF64();
			case BinaryTokens.SignedFloat64: return -this.readF64();
			case BinaryTokens.Array: return this.readValueArray();
			case BinaryTokens.EmptyArray: return this.createObjectID([]);
			case BinaryTokens.ObjectReference: return this._objectIDs.get(this.read32());
			case BinaryTokens.Date: return this.createObjectID(new Date(this.readF64()));
			// eslint-disable-next-line no-new-wrappers
			case BinaryTokens.BooleanObject: return this.createObjectID(new Boolean(this.read8()));
			// eslint-disable-next-line no-new-wrappers
			case BinaryTokens.NumberObject: return this.createObjectID(new Number(this.readF64()));
			// eslint-disable-next-line no-new-wrappers
			case BinaryTokens.StringObject: return this.createObjectID(new String(this.readString()));
			case BinaryTokens.EmptyObject: return this.createObjectID({});
			case BinaryTokens.Object: return this.readValueObject();
			case BinaryTokens.RegExp: return this.createObjectID(new RegExp(this.readString(), RegExps.flagsFromInteger(this.read8())));
			case BinaryTokens.Map: return this.readValueMap();
			case BinaryTokens.EmptyMap: return this.createObjectID(new Map());
			case BinaryTokens.Set: return this.readValueSet();
			case BinaryTokens.EmptySet: return this.createObjectID(new Set());
			case BinaryTokens.ArrayBuffer: return this.readValueArrayBuffer();
			case BinaryTokens.WeakMap: return this.createObjectID(new WeakMap());
			case BinaryTokens.WeakSet: return this.createObjectID(new WeakSet());
			case BinaryTokens.Int8Array:
			case BinaryTokens.Uint8Array:
			case BinaryTokens.Uint8ClampedArray:
			case BinaryTokens.Int16Array:
			case BinaryTokens.Uint16Array:
			case BinaryTokens.Int32Array:
			case BinaryTokens.Uint32Array:
			case BinaryTokens.Float32Array:
			case BinaryTokens.Float64Array:
			case BinaryTokens.DataView: return this.readValueTypedArray(type);
			default: throw new DeserializerError(`Unknown type received: ${type}`, DeserializerReason.UnknownType);
		}
	}

	private readValueTypedArray(token: BinaryTokens) {
		// Read the byte length, then create a shared ArrayBuffer for the desired
		// typedArray and an Uint8Array which we write to.
		const byteLength = this.read32();
		this.ensureBytes(byteLength);

		let value: TypedArray;
		// Fast-path if we are deserializing an Uint8Array
		if (token === BinaryTokens.Uint8Array) {
			value = this._buffer!.subarray(this.offset, this.offset + byteLength);
		} else {
			const buffer = new ArrayBuffer(byteLength);
			const ctor = TypedArrays.typedArrayTagToConstructor.get(token)!;
			value = new ctor(buffer);
			new Uint8Array(buffer).set(this._buffer!.subarray(this.offset, this.offset + byteLength));
		}
		this.offset += byteLength;
		return this.createObjectID(value);
	}

	private readValueArrayBuffer() {
		const value = this.createObjectID(new ArrayBuffer(this.read32()));

		const uint8Array = new Uint8Array(value);
		for (let i = 0, max = uint8Array.length; i < max; i++) {
			uint8Array[i] = this.read8();
		}
		return value;
	}

	private readValueSet() {
		const value = this.createObjectID(new Set());
		while (!this.readNullTerminator()) {
			value.add(this.read());
		}

		return value;
	}

	private readValueMap() {
		const value = this.createObjectID(new Map());
		while (!this.readNullTerminator()) {
			value.set(this.read(), this.read());
		}

		return value;
	}

	private readValueObject() {
		const value = this.createObjectID({}) as Record<string | number, unknown>;
		while (!this.readNullTerminator()) {
			const entryKey = this.read() as string | number;
			const entryValue = this.read();
			value[entryKey] = entryValue;
		}

		return value;
	}

	private readValueArray() {
		const value = this.createObjectID([] as unknown[]);
		let i = 0;
		while (!this.readNullTerminator()) {
			if (this.read8() !== BinaryTokens.Hole) {
				this.offsetBack();
				value[i] = this.read();
			}
			++i;
		}

		// This is required for holey arrays
		value.length = i;

		return value;
	}

	private readString() {
		const end = this._buffer!.indexOf(BinaryTokens.NullPointer, this.offset);
		if (end === -1) {
			throw new DeserializerError('Found End-Of-Buffer, expecting a `NullTerminator` before.', DeserializerReason.UnexpectedEndOfBuffer);
		}
		const sub = this._buffer!.subarray(this.offset, end);
		const str = Deserializer._textDecoder.decode(sub);
		this.offset = end + 1;
		return str;
	}

	private readValueBigInt(sign: boolean) {
		const byteLength = this.read32();

		let value = BigIntegers.ZERO!;
		let b = BigIntegers.ONE!;

		for (let i = 0; i < byteLength; i++) {
			const digit = this.read8();
			value += BigInt(digit) * b;
			b <<= BigIntegers.EIGHT!;
		}

		return sign ? -value : value;
	}

	private readNullTerminator() {
		if (this.watch8() === BinaryTokens.NullPointer) {
			++this.offset;
			return true;
		} else if (this.finished) {
			throw new DeserializerError('Found End-Of-Buffer, expecting a `NullTerminator` before.', DeserializerReason.UnexpectedEndOfBuffer);
		}
		return false;
	}

	private createObjectID<T>(value: T) {
		this._objectIDs.set(this._objectIDs.size, value);
		return value;
	}

	private offsetBack() {
		--this.offset;
	}

	private watch8() {
		return this._buffer![this.offset];
	}

	private read8() {
		this.ensureBytes(1);
		return this._buffer![this.offset++];
	}

	private read32() {
		this.ensureBytes(4);
		return (this._buffer![this.offset++] * (2 ** 24)) +
			(this._buffer![this.offset++] * (2 ** 16)) +
			(this._buffer![this.offset++] * (2 ** 8)) +
			this._buffer![this.offset++];

	}

	private readF64() {
		this.ensureBytes(8);
		uInt8Float64Array[0] = this._buffer![this.offset++];
		uInt8Float64Array[1] = this._buffer![this.offset++];
		uInt8Float64Array[2] = this._buffer![this.offset++];
		uInt8Float64Array[3] = this._buffer![this.offset++];
		uInt8Float64Array[4] = this._buffer![this.offset++];
		uInt8Float64Array[5] = this._buffer![this.offset++];
		uInt8Float64Array[6] = this._buffer![this.offset++];
		uInt8Float64Array[7] = this._buffer![this.offset++];
		return float64Array[0];
	}

	private ensureBytes(amount: number) {
		if (this.offset + amount > this._buffer!.length) {
			throw new DeserializerError(`Found End-Of-Buffer, expecting ${amount} byte(s).`, DeserializerReason.UnexpectedEndOfBuffer);
		}
	}

	private static _textDecoder = new TextDecoder();

}
