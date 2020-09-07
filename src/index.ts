import {
	AppConfig,
	OpenIdConfiguration,
	AuthParams,
	TokenResponse,
} from "./types";
import { setItem, getItem, removeItem } from "./storage.js";
import {
	readState,
	clearState,
	generateAuthorizeState,
	storeState,
} from "./state.js";
import { sha256 } from "./crypto.js";

export function handleRedirectResponse(appConfig: AppConfig) {
	if (location.hash.indexOf("code=") !== -1) {
		const params = new URLSearchParams(location.hash.slice(1));
		// location.hash = ""; // TODO: Clear hash when not debugging

		const stateId = params.get("state");
		if (!stateId) {
			throw new Error(
				`Redirect response does not contain the required state parameter`
			);
		}

		const returnUrl = readState(stateId)?.returnUrl;
		redeemCode(appConfig, params).then(() => {
			if (returnUrl) {
				location.replace(returnUrl);
			}
		});
	}

	// TODO: Handle errors: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow#error-response
	// error=access_denied&error_subcode=cancel&state=3596ba7a-1425-4173-9977-f2151a142316
}

export function getTokens() {
	// TODO: Should this be aware if a redeem request is in flight and return a Promise of tokens
	// in case they are being required?
	return getItem("tokens");
}

export function logout() {
	// TODO: Should we provide an option to issue a logout to the authority?
	removeItem("tokens");
}

export function refreshSession(appConfig: AppConfig, authParams?: AuthParams) {
	const tokenData = getItem("tokens");
	if (!tokenData) {
		throw new Error("No token data exist to refresh with");
	}

	return getOpenIdConfig(appConfig.authority).then((config) => {
		const authRequest = new URLSearchParams();
		authRequest.append("client_id", appConfig.clientId);
		authRequest.append("grant_type", "refresh_token");
		authRequest.append("scope", getScope(authParams));
		authRequest.append("refresh_token", tokenData.refresh_token);
		applyExtraParams(authRequest, authParams);

		// TODO: Handle Errors
		// TODO: Requires fetch understand URLSearchParams in order to properly
		// set the content-type of the request
		return fetch(config.token_endpoint, {
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
			.then((res) => res.json() as Promise<TokenResponse>)
			.then((res) => {
				setItem("tokens", { ...res, issuedAt: Date.now() });
				console.log(res);
			});
	});
}

export function redeemCode(
	appConfig: AppConfig,
	authorizeResponse: URLSearchParams,
	authParams?: AuthParams
) {
	const code = authorizeResponse.get("code");
	const stateId = authorizeResponse.get("state");

	if (!code) {
		throw new Error(
			`Authorize response does not contain the required code parameter`
		);
	}

	if (!stateId) {
		throw new Error(
			`Authorize response does not contain the required state parameter`
		);
	}

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
		applyExtraParams(authRequest, authParams);

		// TODO: Handle Errors
		// TODO: Requires fetch understand URLSearchParams in order to properly
		// set the content-type of the request
		return fetch(config.token_endpoint, {
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
			.then((res) => res.json() as Promise<TokenResponse>)
			.then((res) => {
				// TODO: Verify ID token signature?
				// TODO: Handle errors https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow#error-response-1

				setItem("tokens", { ...res, issuedAt: Date.now() });
				console.log(res);
			});
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
	const key = "openid-config::" + authority;

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
	const state = generateAuthorizeState(
		appConfig.redirectUri,
		authParams?.state
	);

	storeState(state);

	return Promise.all([
		getOpenIdConfig(appConfig.authority),
		sha256(state.codeVerifier),
	])
		.then(([config, codeChallenge]) => {
			const authRequest = new URL(config.authorization_endpoint);
			const params = authRequest.searchParams;
			params.append("client_id", appConfig.clientId);
			params.append("response_type", "code");
			params.append("redirect_uri", appConfig.redirectUri);
			params.append("scope", getScope(authParams));
			params.append("response_mode", "fragment"); // or Fragment
			params.append("state", state.id);
			params.append("code_challenge", codeChallenge);
			params.append("code_challenge_method", "S256");
			params.append("client_info", "1");
			applyExtraParams(authRequest.searchParams, authParams);

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

function applyExtraParams(
	request: URLSearchParams,
	authParams?: AuthParams
): void {
	if (authParams) {
		if (authParams.loginHint) {
			request.append("login_hint", authParams.loginHint);
		}

		if (authParams.prompt) {
			request.append("prompt", authParams.prompt);
		}

		for (let param in authParams.extraParams) {
			request.append(param, authParams.extraParams[param]);
		}
	}
}
