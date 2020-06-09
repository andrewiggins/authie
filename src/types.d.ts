export interface AppConfig {
	authority: string;
	clientId: string;
	redirectUri: string;
}

export interface OpenIdConfiguration {
	// "https://login.microsoftonline.com/{tenantid}/v2.0"
	issuer: string;
	// "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
	authorization_endpoint: string;
	// "https://login.microsoftonline.com/common/oauth2/v2.0/token"
	token_endpoint: string;
	// "https://graph.microsoft.com/oidc/userinfo"
	userinfo_endpoint?: string;
	// "https://login.microsoftonline.com/common/discovery/v2.0/keys"
	jwks_uri: string;
	// ["openid", "profile", "email", "offline_access"]
	scopes_supported?: string[];
	// ["code","id_token","code id_token","id_token token"];
	response_types_supported: string[];
	// ["query", "fragment", "form_post"]
	response_modes_supported?: string[];
	// ["pairwise"]
	subject_types_supported: string[];
	// ["RS256"]
	id_token_signing_alg_values_supported: string[];
	// ["sub","iss","cloud_instance_name","cloud_instance_host_name","cloud_graph_host_name","msgraph_host","aud","exp","iat","auth_time","acr","nonce","preferred_username","name","tid","ver","at_hash","c_hash","email"]
	claims_supported?: string[];
	// false
	request_uri_parameter_supported: boolean;
}

export interface AuthParams {
	scopes?: string[];
	loginHint?: string;
	prompt?: string;
	state?: string;
	extraParams: Record<string, string>;
}

/** https://tools.ietf.org/html/rfc6749#section-4.1.2.1 */
export interface AuthorizationCodeError {
	/**
	 * invalid_request: The request is missing a required parameter, includes an
	 * invalid parameter value, includes a parameter more than once, or is
	 * otherwise malformed.
	 *
	 * unauthorized_client: The client is not authorized to request an
	 * authorization code using this method.
	 *
	 * access_denied: The resource owner or authorization server denied the
	 * request.
	 *
	 * unsupported_response_type: The authorization server does not support
	 * obtaining an authorization code using this method.
	 *
	 * invalid_scope: The requested scope is invalid, unknown, or malformed.
	 *
	 * server_error: The authorization server encountered an unexpected condition
	 * that prevented it from fulfilling the request. (This error code is needed
	 * because a 500 Internal Server Error HTTP status code cannot be returned to
	 * the client via an HTTP redirect.)
	 *
	 * temporarily_unavailable: The authorization server is currently unable to
	 * handle the request due to a temporary overloading or maintenance of the
	 * server.  (This error code is needed because a 503 Service Unavailable HTTP
	 * status code cannot be returned to the client via an HTTP redirect.)
	 */
	error:
		| "invalid_request"
		| "unauthorized_client"
		| "access_denied"
		| "unsupported_response_type"
		| "invalid_scope"
		| "server_error"
		| "temporarily_unavailable";

	/**
	 * REQUIRED if a "state" parameter was present in the client authorization
	 * request.  The exact value received from the client.
	 */
	state: string;

	/**
	 * Human-readable ASCII [USASCII] text providing additional information, used
	 * to assist the client developer in understanding the error that occurred.
	 */
	error_description?: string;

	/**
	 * A URI identifying a human-readable web page with information about the
	 * error, used to provide the client developer with additional information
	 * about the error.
	 */
	error_uri?: string;
}

/**
 * https://tools.ietf.org/html/rfc6749#section-5.1
 */
export interface TokenResponse {
	/** The access token issued by the authorization server. */
	access_token: string;

	/**
	 * The type of the token issued as described in Section 7.1.  Value is case
	 * insensitive.
	 */
	token_type: string;

	/**
	 * The lifetime in seconds of the access token.  For example, the value
	 * "3600" denotes that the access token will expire in one hour from the time
	 * the response was generated. If omitted, the authorization server SHOULD
	 * provide the expiration time via other means or document the default value.
	 */
	expires_in?: number;

	/**
	 * The refresh token, which can be used to obtain new access tokens using the
	 * same authorization grant as described in Section 6.
	 */
	refresh_token?: string;

	/**
	 * OPTIONAL, if identical to the scope requested by the client; otherwise,
	 * REQUIRED.  The scope of the access token as described by Section 3.3.
	 */
	scope?: string;
}

/**
 * https://tools.ietf.org/html/rfc6749#section-5.2
 */
export interface TokenResponseError {
	/**
	 * invalid_request: The request is missing a required parameter, includes an
	 * unsupported parameter value (other than grant type), repeats a parameter,
	 * includes multiple credentials, utilizes more than one mechanism for
	 * authenticating the client, or is otherwise malformed.
	 *
	 * invalid_client: Client authentication failed (e.g., unknown client, no
	 * client authentication included, or unsupported authentication method).  The
	 * authorization server MAY return an HTTP 401 (Unauthorized) status code to
	 * indicate which HTTP authentication schemes are supported.  If the client
	 * attempted to authenticate via the "Authorization" request header field, the
	 * authorization server MUST respond with an HTTP 401 (Unauthorized) status
	 * code and include the "WWW-Authenticate" response header field matching the
	 * authentication scheme used by the client.
	 *
	 * invalid_grant: The provided authorization grant (e.g., authorization code,
	 * resource owner credentials) or refresh token is invalid, expired, revoked,
	 * does not match the redirection URI used in the authorization request, or
	 * was issued to another client.
	 *
	 * unauthorized_client: The authenticated client is not authorized to use this
	 * authorization grant type.
	 *
	 * unsupported_grant_type: The authorization grant type is not supported by
	 * the authorization server.
	 *
	 * invalid_scope: The requested scope is invalid, unknown, malformed, or
	 * exceeds the scope granted by the resource owner.
	 */
	error:
		| "invalid_request"
		| "invalid_client"
		| "invalid_grant"
		| "unauthorized_client"
		| "unsupported_grant_type"
		| "invalid_scope";

	/**
	 * Human-readable ASCII [USASCII] text providing additional information, used
	 * to assist the client developer in understanding the error that occurred.
	 */
	error_description?: string;

	/**
	 * A URI identifying a human-readable web page with information about the
	 * error, used to provide the client developer with additional information
	 * about the error.
	 */
	error_uri?: string;
}
