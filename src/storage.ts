const prefix = "authie::";
const cache = sessionStorage;

export function setItem(key: string, value: Record<string, any>): void {
	cache.setItem(prefix + key, JSON.stringify(value));
}

export function getItem(key: string): Record<string, any> | null {
	const value = cache.getItem(prefix + key);
	return value ? JSON.parse(value) : value;
}

export function removeItem(key: string): void {
	return cache.removeItem(prefix + key);
}
