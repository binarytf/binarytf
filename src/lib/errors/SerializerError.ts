export class SerializerError extends Error {

	public kind: SerializerReason;

	public constructor(message: string, kind: SerializerReason) {
		super(message);
		this.kind = kind;
	}

}

export enum SerializerReason {
	UnsupportedType = 'UnsupportedType',
	UnsupportedSerializedType = 'UnsupportedSerializedType',
	UnexpectedNullValue = 'UnexpectedNullValue'
}
