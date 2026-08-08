import { api } from "@/lib/api";

export type ExcursionGroup = {
	id: number;
	excursionSlug: string;
	excursionTitle: string;
	image: string;
	price: number;
	duration: string;
	location: string;
	description: string;
	status: "OPEN" | "CONFIRMED" | "COMPLETED";
	confirmedDate: string | null;
	createdAt: string;
	createdById?: number | null;
};

// Cada excursão pode ter vários grupos de viagem ao longo do tempo — depois de
// um ser confirmado, a próxima reserva abre um novo em vez de se juntar ao já
// confirmado (ver BookingController.create no backend).
export const excursionGroupsService = {
	getAll: (): Promise<ExcursionGroup[]> => api.get<ExcursionGroup[]>("/api/excursion-groups"),

	confirm: (id: number, confirmedDate: string): Promise<ExcursionGroup> =>
		api.post<ExcursionGroup>(`/api/excursion-groups/${id}/confirm`, { confirmedDate }),

	reopen: (id: number): Promise<ExcursionGroup> =>
		api.post<ExcursionGroup>(`/api/excursion-groups/${id}/reopen`, {}),

	complete: (id: number): Promise<ExcursionGroup> =>
		api.post<ExcursionGroup>(`/api/excursion-groups/${id}/complete`, {}),
};
