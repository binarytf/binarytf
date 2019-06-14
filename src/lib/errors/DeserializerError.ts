export class DeserializerError extends Error {

	public kind: DeserializerReason;

	public constructor(message: string, kind: DeserializerReason) {
		super(message);
		this.kind = kind;
	}

}

export enum DeserializerReason {
	UnknownType = 'UnknownType',
	UnexpectedNullTerminator = 'UnexpectedNullTerminator'
}
