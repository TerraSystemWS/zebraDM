import { api } from "@/lib/api";

export type Excursao = {
	id?: number;
	slug: string;
	title: string;
	image: string;
	price: number;
	duration: string;
	location: string;
	rating: number;
	reviews: number;
	description: string;
	categories: string[];
	createdById?: number | null;
	status: string;
};

export const excursoesService = {
	getAll: (includeArchived = false): Promise<Excursao[]> =>
		api.get<Excursao[]>(`/api/excursions${includeArchived ? "?includeArchived=true" : ""}`),

	getBySlug: (slug: string): Promise<Excursao> => api.get<Excursao>(`/api/excursions/${slug}`),

	create: (data: Excursao): Promise<Excursao> => api.post<Excursao>("/api/excursions", data),

	update: (slug: string, data: Partial<Excursao>): Promise<Excursao> => api.put<Excursao>(`/api/excursions/${slug}`, data),

	delete: (slug: string): Promise<void> => api.delete<void>(`/api/excursions/${slug}`),

	archive: (slug: string): Promise<Excursao> => api.post<Excursao>(`/api/excursions/${slug}/archive`, {}),

	restore: (slug: string): Promise<Excursao> => api.post<Excursao>(`/api/excursions/${slug}/restore`, {}),
};
