import { setItem, getItem, removeItem } from "./storage.js";
import { uuid, base64UrlEncode } from "./crypto.js";

interface InternalState {
	id: string;
	codeVerifier: string;
	userState?: string;
}

const UUID_SIZE = 16;
const VERIFIER_SIZE = 64;

export function generateState(userState?: string): InternalState {
	const bytes = new Uint8Array(UUID_SIZE + VERIFIER_SIZE);
	crypto.getRandomValues(bytes);

	return {
		id: uuid(bytes.subarray(0, UUID_SIZE)),
		userState,
		codeVerifier: base64UrlEncode(bytes.subarray(UUID_SIZE)),
	};
}

export function storeState(state: InternalState): void {
	setItem("state::" + state.id, state);
}

export function readState(id: string): InternalState | null {
	return getItem("state::" + id) as InternalState | null;
}

export function clearState(id: string): void {
	removeItem("state::" + id);
}
