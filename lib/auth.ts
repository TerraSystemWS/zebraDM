import { api } from "./api";
import { setSession, clearSession, getToken } from "./api";

export interface AuthResponse {
	token: string;
	id: number;
	fullName: string;
	email: string;
	role: string;
	phone: string | null;
}

export interface UpdateMeInput {
	fullName: string;
	email: string;
	phone?: string | null;
	currentPassword: string;
	newPassword?: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
	const response = await api.post<AuthResponse>("/api/auth/login", { email, password });
	if (response.role !== "ADMIN" && response.role !== "AGENTE") {
		throw new Error("Esta conta não tem acesso ao painel administrativo.");
	}
	setSession(response.token, response);
	return response;
}

export async function getMe(): Promise<AuthResponse> {
	return api.get<AuthResponse>("/api/auth/me");
}

export async function updateMe(input: UpdateMeInput): Promise<AuthResponse> {
	const response = await api.patch<AuthResponse>("/api/auth/me", input);
	setSession(response.token, response);
	return response;
}

export function logout() {
	clearSession();
}

export function isAuthenticated(): boolean {
	return !!getToken();
}
