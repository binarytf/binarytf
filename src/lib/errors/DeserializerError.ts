export class DeserializerError extends Error {

	public kind: Reason;

	public constructor(message: string, kind: Reason) {
		super(message);
		this.kind = kind;
	}

}

export enum Reason {
	UnknownType = 'UnknownType',
	UnexpectedNullTerminator = 'UnexpectedNullTerminator'
}
