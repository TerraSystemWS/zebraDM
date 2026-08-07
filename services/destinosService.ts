import { api } from "@/lib/api";

export interface Tour {
	id: number;
	title: string;
	image: string;
	images: string[];
	price: number;
	category: string[];
	tours: number;
	description: string;
	createdById?: number | null;
	status: string;
}

export const destinosService = {
	getAll: (includeArchived = false): Promise<Tour[]> =>
		api.get<Tour[]>(`/api/tours${includeArchived ? "?includeArchived=true" : ""}`),

	getById: (id: number): Promise<Tour> => api.get<Tour>(`/api/tours/${id}`),

	create: (data: Omit<Tour, "id">): Promise<Tour> => api.post<Tour>("/api/tours", data),

	update: (id: number, data: Partial<Tour>): Promise<Tour> => api.put<Tour>(`/api/tours/${id}`, data),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/tours/${id}`),

	archive: (id: number): Promise<Tour> => api.post<Tour>(`/api/tours/${id}/archive`, {}),

	restore: (id: number): Promise<Tour> => api.post<Tour>(`/api/tours/${id}/restore`, {}),
};
