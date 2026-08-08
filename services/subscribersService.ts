import { api } from "@/lib/api";

export interface Subscriber {
	id: number;
	email: string;
	subscribedAt: string;
	status: string;
}

export const subscribersService = {
	getAll: (): Promise<Subscriber[]> => api.get<Subscriber[]>("/api/subscribers"),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/subscribers/${id}`),
};
