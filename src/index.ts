import { Deserializer } from './lib/Deserializer';
import { OnUnsupported, Serializer } from './lib/Serializer';

export function serialize(data: any, onUnsupported?: OnUnsupported) {
	return new Serializer(data, onUnsupported).process();
}

export function deserialize<T = unknown>(buffer: Uint8Array, offset = -1) {
	const deserializer = new Deserializer(buffer);
	if (offset !== -1) deserializer.offset = offset;
	const value = deserializer.read() as T;
	deserializer.clean();
	return value;
}

export function deserializeWithMetadata<T = unknown>(buffer: Uint8Array, offset = -1) {
	const deserializer = new Deserializer(buffer);
	if (offset !== -1) deserializer.offset = offset;
	const value = deserializer.read() as T;
	const bufferOffset = deserializer.offset;
	deserializer.clean();

	return {
		value,
		offset: bufferOffset === buffer.byteLength ? -1 : bufferOffset
	};
}
