export interface AppConfig {
	authority: string;
	clientId: string;
	redirectUri: string | (() => string);
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
