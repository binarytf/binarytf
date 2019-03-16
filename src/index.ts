import { Serializer } from './lib/Serializer';
import { Deserializer } from './lib/Deserializer';

export function serialize(data: any) {
	return new Serializer(data).process();
}

export function deserialize(buffer: Uint8Array) {
	return new Deserializer(buffer).process();
}
