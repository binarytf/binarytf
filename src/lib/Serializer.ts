import { BinaryPrimitives, BinaryTokens } from './util/constants';
import { Numbers, BigIntegers, RegExps } from './util/util';

const MIN_INT32 = -(2 ** 31);
const MAX_INT32 = (2 ** 31) - 1;

import { TextEncoder } from 'util';

export class Serializer {
	private _buffer: Uint8Array = new Uint8Array(16);
	private _offset = 0;
	private _objectIDs = new Map() as Map<Record<any, any>, number>;
	private _data: any;
	private static _textEncoder = new TextEncoder();

	public constructor(data: any) {
		this._data = data;
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
			case BinaryPrimitives.BigInt: {
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

				return;
			}
			case BinaryPrimitives.Boolean: {
				this.ensureAlloc(1);
				this._buffer[this._offset++] = BinaryTokens.Boolean;
				this.writeValueBoolean(value);

				return;
			}
			case BinaryPrimitives.Number: {
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

				return;
			}
			case BinaryPrimitives.Object: {
				if (value === null) {
					this.ensureAlloc(1);
					this._buffer[this._offset++] = BinaryTokens.Null;
					return;
				}

				// Circular reference detection
				const id = this._objectIDs.get(value);
				if (typeof id === 'number') {
					this.ensureAlloc(5);
					this._buffer[this._offset++] = BinaryTokens.ObjectReference;
					this.writeUint32(id, this._offset);
					this._offset += 4;
					return;
				}
				this._objectIDs.set(value, this._objectIDs.size);

				if (Array.isArray(value)) {
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

					return;
				}

				switch (Object.prototype.toString.call(value)) {
					case '[object String]': {
						const typedSource = value as String;
						this.ensureAlloc(1);
						this._buffer[this._offset++] = BinaryTokens.StringObject;
						this.writeValueString(typedSource.valueOf());

						return;
					}
					case '[object Boolean]': {
						const typedSource = value as Boolean;
						this.ensureAlloc(1);
						this._buffer[this._offset++] = BinaryTokens.BooleanObject;
						this.writeValueBoolean(typedSource.valueOf());

						return;
					}
					case '[object Number]': {
						const typedSource = value as Number;
						this.ensureAlloc(1);
						this._buffer[this._offset++] = BinaryTokens.NumberObject;
						this.writeValueFloat64(typedSource.valueOf());

						return;
					}
					case '[object Date]': {
						const typedSource = value as Date;
						this.ensureAlloc(1);
						this._buffer[this._offset++] = BinaryTokens.Date;
						this.writeValueFloat64(typedSource.valueOf());

						return;
					}
					case '[object RegExp]': {
						const typedSource = value as RegExp;
						this.ensureAlloc(1);
						this._buffer[this._offset++] = BinaryTokens.RegExp;
						this.writeValueString(typedSource.source);
						this.writeValueByte(RegExps.flagsAsInteger(typedSource));

						return;
					}
					case '[object Object]': {
						const typedSource = value as Record<any, any>;

						const keys = Object.keys(typedSource);
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
							this.parse(typedSource[entryKey]);
						}

						return;
					}
					case '[object Map]': {
						const typedSource = value as Map<any, any>;
						if (typedSource.size === 0) {
							this.ensureAlloc(1);
							this._buffer[this._offset++] = BinaryTokens.EmptyMap;
							return;
						}

						this.ensureAlloc(5);
						this._buffer[this._offset++] = BinaryTokens.Map;
						this.writeUint32(typedSource.size, this._offset);
						this._offset += 4;

						for (const [entryKey, entryValue] of typedSource.entries()) {
							this.parse(entryKey);
							this.parse(entryValue);
						}

						return;
					}
					case '[object Set]': {
						const typedSource = value as Set<any>;
						if (typedSource.size === 0) {
							this.ensureAlloc(1);
							this._buffer[this._offset++] = BinaryTokens.EmptySet;
							return;
						}

						this.ensureAlloc(5);
						this._buffer[this._offset++] = BinaryTokens.Set;
						this.writeUint32(typedSource.size, this._offset);
						this._offset += 4;

						for (const entryValue of typedSource) {
							this.parse(entryValue);
						}

						return;
					}
					case '[object ArrayBuffer]': {
						const typedSource = value as ArrayBuffer;
						this.ensureAlloc(1);
						this._buffer[this._offset++] = BinaryTokens.ArrayBuffer;

						// We cannot read an ArrayBuffer, so we create an Uint8Array.
						const uint8Array = new Uint8Array(typedSource);
						this.ensureAlloc(4 + uint8Array.length);

						// Write the byte length
						this.writeUint32(uint8Array.length, this._offset);
						this._offset += 4;

						// Write the data
						this._buffer.set(uint8Array, this._offset);
						this._offset += uint8Array.length;
						return;
					}
					default: {
						// TODO: Handle TypedArrays
						return;
					}
				}
			}
			case BinaryPrimitives.String: {
				this.ensureAlloc(1);
				this._buffer[this._offset++] = BinaryTokens.String;
				this.writeValueString(value);

				return;
			}
			case BinaryPrimitives.Undefined: {
				this.ensureAlloc(1);
				this._buffer[this._offset++] = BinaryTokens.Undefined;

				return;
			}
			default: throw new TypeError(`Unsupported type ${hint}`);
		}
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
		this._buffer[offset++] = uInt8Float64Array[0];
		this._buffer[offset++] = uInt8Float64Array[1];
		this._buffer[offset++] = uInt8Float64Array[2];
		this._buffer[offset++] = uInt8Float64Array[3];
		this._buffer[offset++] = uInt8Float64Array[4];
		this._buffer[offset++] = uInt8Float64Array[5];
		this._buffer[offset++] = uInt8Float64Array[6];
		this._buffer[offset++] = uInt8Float64Array[7];
	}

}

const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(float64Array.buffer);
