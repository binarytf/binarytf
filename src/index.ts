import { Serializer, OnUnsupported } from './lib/Serializer';
import { Deserializer } from './lib/Deserializer';

export function serialize(data: any, onUnsupported?: OnUnsupported) {
	return new Serializer(data, onUnsupported).process();
}

export function deserialize(buffer: Uint8Array) {
	return new Deserializer(buffer).process();
}
