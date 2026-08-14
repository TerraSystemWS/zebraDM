import { api } from "@/lib/api";

export type CampaignPlacement = "HOME_HERO" | "HOME_STRIP" | "LOJA_TOP" | "EXCURSOES_TOP" | "HOTEL_TOP";

export interface Campaign {
	id: number;
	name: string;
	imageUrl: string;
	altText: string | null;
	placement: CampaignPlacement;
	voucherId: number | null;
	productId: number | null;
	excursionId: number | null;
	roomTypeId: number | null;
	targetLabel: string | null;
	title: string | null;
	subtitle: string | null;
	linkUrl: string | null;
	startDate: string | null;
	endDate: string | null;
	priority: number;
	active: boolean;
	clickCount: number;
	createdById: number | null;
	createdAt: string;
	status: string;
}

export interface CampaignInput {
	name: string;
	imageUrl: string;
	altText?: string | null;
	placement: CampaignPlacement;
	voucherId?: number | null;
	productId?: number | null;
	excursionId?: number | null;
	roomTypeId?: number | null;
	title?: string | null;
	subtitle?: string | null;
	linkUrl?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	priority: number;
	active: boolean;
}

export const campaignsService = {
	getAll: (): Promise<Campaign[]> => api.get<Campaign[]>("/api/campaigns"),
	create: (data: CampaignInput): Promise<Campaign> => api.post<Campaign>("/api/campaigns", data),
	update: (id: number, data: CampaignInput): Promise<Campaign> => api.patch<Campaign>(`/api/campaigns/${id}`, data),
	delete: (id: number): Promise<void> => api.delete<void>(`/api/campaigns/${id}`),
};
