export interface AppConfig {
	authority: string;
	clientId: string;
	redirectUri: string | (() => string);
}
