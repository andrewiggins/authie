import { AppConfig, OpenIdConfiguration } from "./config";
import { setItem, getItem } from "./storage.js";

export function loginRedirect(appConfig: AppConfig) {
	getOpenIdConfig(appConfig.authority).then((config) => console.log(config));
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
