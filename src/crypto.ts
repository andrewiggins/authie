function base64UrlEncode(binary: string): string {
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlDecode(str: string): string {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	return atob(str + "===".slice((str.length + 3) % 4));
}

export function generateCodeVerifier() {
	// fromCharCode requires number[] which Uint8Array doesn't satisfy
	const bytes: any = crypto.getRandomValues(new Uint8Array(64));
	// TODO: Bench using String.fromCharCode & TextDecoder
	const str = String.fromCharCode.apply(null, bytes);
	return base64UrlEncode(str);
}

export function generateCodeChallenge(
	codeVerifier: string
): PromiseLike<string> {
	const msgUint8 = new TextEncoder().encode(codeVerifier);
	return (
		crypto.subtle
			.digest("SHA-256", msgUint8)
			.then((buffer) =>
				String.fromCharCode.apply(null, new Uint8Array(buffer) as any)
			)
			// .then((buffer) => new TextDecoder().decode(buffer))
			.then((str) => base64UrlEncode(str))
	);
}
