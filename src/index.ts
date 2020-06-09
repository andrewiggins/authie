import { AppConfig, OpenIdConfiguration, AuthParams } from "./types";
import { setItem, getItem, removeItem } from "./storage.js";

export function handleRedirectResponse(appConfig: AppConfig) {
	if (location.hash.indexOf("code=") !== -1) {
		const [rawCode, rawStateId] = location.hash.slice(1).split("&");
		// location.hash = "";

		redeemCode(appConfig, rawCode.split("=")[1], rawStateId.split("=")[1]);
	}

	// TODO: Handle errors
}

export function redeemCode(
	appConfig: AppConfig,
	code: string,
	stateId: string,
	authParams?: AuthParams
) {
	const state = readState(stateId);
	if (!state) {
		throw new Error(
			"Auth request received with unrecognized state param: " + stateId
		);
	}

	clearState(state.id);

	// TODO: Is how scopes passed sufficient? Do auth servers support reusing
	// tokens to get different access tokens with different scopes? If not, then
	// we should associate the scopes provided in authorize request with state so
	// we can get an access_token with the same scopes authorized

	return getOpenIdConfig(appConfig.authority).then((config) => {
		const authRequest = new URLSearchParams();
		authRequest.append("client_id", appConfig.clientId);
		authRequest.append("grant_type", "authorization_code");
		authRequest.append("scope", getScope(authParams));
		authRequest.append("code", code);
		authRequest.append("redirect_uri", appConfig.redirectUri);
		authRequest.append("code_verifier", state.codeVerifier);

		// TODO: Handle Errors
		// TODO: Requires fetch understand URLSearchParams in order to properly
		// set the content-type of the request
		fetch(config.token_endpoint, {
			method: "POST",
			body: authRequest,
		})
			.then((res) => {
				if (res.ok) {
					return res;
				} else {
					throw new Error("Error from token endpoint");
				}
			})
			.then((res) => res.json())
			.then((res) => (setItem("token_response", res), res))
			.then((res) => console.log(res));
	});
}

export function loginRedirect(
	appConfig: AppConfig,
	authParams?: AuthParams
): Promise<void> {
	// Return promise to allow developer to handle errors in generating authorize request
	return generateAuthorizeRequest(appConfig, authParams).then((authRequest) => {
		console.log(authRequest.toString());
		location.assign(authRequest.toString());
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

function generateAuthorizeRequest(
	appConfig: AppConfig,
	authParams?: AuthParams
): Promise<URL> {
	const state = generateState(authParams?.state);
	storeState(state);

	return Promise.all([
		getOpenIdConfig(appConfig.authority),
		generateCodeChallenge(state.codeVerifier),
	])
		.then(([config, codeChallenge]) => {
			const authRequest = new URL(config.authorization_endpoint);
			authRequest.searchParams.append("client_id", appConfig.clientId);
			authRequest.searchParams.append("response_type", "code");
			authRequest.searchParams.append("redirect_uri", appConfig.redirectUri);
			authRequest.searchParams.append("scope", getScope(authParams));
			authRequest.searchParams.append("response_mode", "fragment"); // or Fragment
			authRequest.searchParams.append("state", state.id);
			authRequest.searchParams.append("code_challenge", codeChallenge);
			authRequest.searchParams.append("code_challenge_method", "S256");

			if (authParams) {
				for (let param in authParams.extraParams) {
					authRequest.searchParams.append(param, authParams.extraParams[param]);
				}
			}

			return authRequest;
		})
		.catch((error) => {
			clearState(state.id);
			throw error;
		});
}

function getScope(authParams?: AuthParams): string {
	let scopes = "";
	if (authParams && authParams.scopes) {
		scopes = authParams.scopes.join(" ").toLowerCase();
	}

	if (scopes.indexOf("profile") == -1) {
		scopes = "profile " + scopes;
	}

	if (scopes.indexOf("openid") == -1) {
		scopes = "openid " + scopes;
	}

	return scopes;
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

function clearState(id: string): void {
	removeItem("state::" + id);
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
