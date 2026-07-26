const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem("zebradash_token");
}

export function setSession(token: string, user: { id: number; fullName: string; email: string; role: string }) {
	localStorage.setItem("zebradash_token", token);
	localStorage.setItem("zebradash_user", JSON.stringify(user));
}

export function clearSession() {
	localStorage.removeItem("zebradash_token");
	localStorage.removeItem("zebradash_user");
}

export function getUser(): { id: number; fullName: string; email: string; role: string } | null {
	if (typeof window === "undefined") return null;
	const raw = localStorage.getItem("zebradash_user");
	return raw ? JSON.parse(raw) : null;
}

class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string> | undefined),
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const res = await fetch(`${API_URL}${path}`, { ...options, headers });

	if (!res.ok) {
		let message = `Erro ${res.status}`;
		try {
			const body = await res.json();
			message = body.message || message;
		} catch {
			// ignore body parse errors
		}
		throw new ApiError(res.status, message);
	}

	if (res.status === 204) {
		return undefined as T;
	}

	return res.json() as Promise<T>;
}

export const api = {
	get: <T>(path: string) => request<T>(path, { method: "GET" }),
	post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
	put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
	patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
	delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
