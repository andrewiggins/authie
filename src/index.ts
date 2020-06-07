import { AppConfig, OpenIdConfiguration, AuthParams } from "./types";
import { setItem, getItem } from "./storage.js";

export function loginRedirect(appConfig: AppConfig, authParams?: AuthParams) {
	getOpenIdConfig(appConfig.authority).then((config) => {
		const state = generateState(authParams?.state);
		storeState(state);

		generateCodeChallenge(state.codeVerifier).then((codeChallenge) => {
			const authRequest = new URL(config.authorization_endpoint);
			authRequest.searchParams.append("client_id", appConfig.clientId);
			authRequest.searchParams.append("response_type", "code");
			authRequest.searchParams.append("redirect_uri", appConfig.redirectUri);
			authRequest.searchParams.append("response_mode", "query");
			authRequest.searchParams.append("state", state.id);
			authRequest.searchParams.append("code_challenge", codeChallenge);
			authRequest.searchParams.append("code_challenge_method", "S256");

			let scopes = "";
			if (authParams && authParams.scopes) {
				scopes = authParams.scopes.join(" ").toLowerCase();
			}

			if (scopes.indexOf("openid") == -1) {
				scopes = "openid " + scopes;
			}

			authRequest.searchParams.append("scope", scopes);

			if (authParams) {
				for (let param in authParams.extraParams) {
					authRequest.searchParams.append(param, authParams.extraParams[param]);
				}
			}

			console.log(authRequest.toString());
			location.assign(authRequest.toString());
		});
	});
}

const openIdConfigPath = "/.well-known/openid-configuration";
function getOpenIdConfig(authority: string): Promise<OpenIdConfiguration> {
	const key = authority + "::openid-config";

	let c;
	if ((c = getItem(key)) !== null) {
		return Promise.resolve(c as OpenIdConfiguration);
	} else {
		return fetch(authority + openIdConfigPath)
			.then((res) => res.json())
			.then((config) => {
				setItem(key, config);
				return config;
			});
	}
}

interface InternalState {
	id: string;
	codeVerifier: string;
	userState?: string;
}

function generateState(userState?: string): InternalState {
	const id = "400fa120-5e9f-411e-94bd-2a23f6695704"; // TODO: Consider using @lukeed/uuid
	return {
		id,
		userState,
		codeVerifier: generateCodeVerifier(),
	};
}

function storeState(state: InternalState): void {
	setItem("state::" + state.id, state);
}

function readState(id: string): InternalState | null {
	return getItem("state::" + id) as InternalState | null;
}

function base64UrlEncode(binary: string): string {
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlDecode(str: string): string {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	return atob(str + "===".slice((str.length + 3) % 4));
}

function generateCodeVerifier() {
	// fromCharCode requires number[] which Uint8Array doesn't satisfy
	const bytes: any = crypto.getRandomValues(new Uint8Array(64));
	// TODO: Bench using String.fromCharCode & TextDecoder
	const str = String.fromCharCode.apply(null, bytes);
	return base64UrlEncode(str);
}

function generateCodeChallenge(codeVerifier: string): PromiseLike<string> {
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
