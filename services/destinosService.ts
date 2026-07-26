import { api } from "@/lib/api";

export interface Tour {
	id: number;
	title: string;
	image: string;
	category: string[];
	tours: number;
	description: string;
	createdById?: number | null;
}

export const destinosService = {
	getAll: (): Promise<Tour[]> => api.get<Tour[]>("/api/tours"),

	getById: (id: number): Promise<Tour> => api.get<Tour>(`/api/tours/${id}`),

	create: (data: Omit<Tour, "id">): Promise<Tour> => api.post<Tour>("/api/tours", data),

	update: (id: number, data: Partial<Tour>): Promise<Tour> => api.put<Tour>(`/api/tours/${id}`, data),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/tours/${id}`),
};
