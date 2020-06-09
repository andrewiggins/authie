// Hexadecimal pair cache: 0x00 - 0xFF
const HEX: string[] = [];
for (let i = 0; i < 256; i++) {
	HEX[i] = (i + 256).toString(16).substring(1);
}

/**
 * Generate a Version 4 (random) RFC4122 UUID. Inspired by @lukeed/uuid - but
 * customized for our use to reuse byte buffers
 * @param bytes A buffer of random bytes to generate the UUID from
 */
export function uuid(bytes: Uint8Array) {
	let uuid = "";
	for (let i = 0; i < 16; i++) {
		let tmp = bytes[i];
		if (i == 6) {
			uuid += HEX[(tmp & 15) | 64];
		} else if (i == 8) {
			uuid += HEX[(tmp & 63) | 128];
		} else {
			uuid += HEX[tmp];
		}

		if (i & 1 && i > 1 && i < 11) {
			uuid += "-";
		}
	}

	return uuid;
}

export function base64UrlEncode(binary: Uint8Array): string {
	// https://esbench.com/bench/5edfc3c812464000a01e46ff
	const byteString = String.fromCharCode.apply(null, binary as any);
	return btoa(byteString)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

function base64UrlDecode(str: string): string {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	return atob(str + "===".slice((str.length + 3) % 4));
}

export function sha256(input: string): PromiseLike<string> {
	const bytes = new TextEncoder().encode(input);
	return crypto.subtle
		.digest("SHA-256", bytes)
		.then((buffer) => base64UrlEncode(new Uint8Array(buffer)));
}
