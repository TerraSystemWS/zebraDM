import { api } from "@/lib/api";

export interface Sponsor {
	id: number;
	image: string;
	link: string;
}

export type SponsorInput = Omit<Sponsor, "id">;

export const sponsorsService = {
	getAll: (): Promise<Sponsor[]> => api.get<Sponsor[]>("/api/sponsors"),

	create: (input: SponsorInput): Promise<Sponsor> => api.post<Sponsor>("/api/sponsors", input),

	update: (id: number, input: SponsorInput): Promise<Sponsor> => api.put<Sponsor>(`/api/sponsors/${id}`, input),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/sponsors/${id}`),
};
