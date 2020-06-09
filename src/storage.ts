const prefix = "authie::";

export function setItem(key: string, value: Record<string, any>): void {
	sessionStorage.setItem(prefix + key, JSON.stringify(value));
}

export function getItem(key: string): Record<string, any> | null {
	const value = sessionStorage.getItem(prefix + key);
	return value ? JSON.parse(value) : value;
}

export function removeItem(key: string): void {
	return sessionStorage.removeItem(prefix + key);
}
