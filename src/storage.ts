const prefix = "authie::";

export function setItem(key: string, value: object): void {
	sessionStorage.setItem(prefix + key, JSON.stringify(value));
}

export function getItem(key: string): object | string | null {
	const value = sessionStorage.getItem(prefix + key);
	return value ? JSON.parse(value) : value;
}

export function removeItem(key: string): void {
	return sessionStorage.removeItem(prefix + key);
}
