import { api } from "@/lib/api";

export type VoucherScope = "ALL" | "EXCURSION" | "ROOM" | "PRODUCT";

export interface Voucher {
	id: number;
	code: string | null;
	requiresCode: boolean;
	discountPercent: number;
	scope: VoucherScope;
	scopeItemId: number | null;
	validFrom: string | null;
	validUntil: string | null;
	maxUses: number | null;
	maxUsesPerUser: number | null;
	active: boolean;
	createdById: number | null;
	createdAt: string;
	usesCount: number;
}

export interface VoucherInput {
	code?: string;
	requiresCode: boolean;
	discountPercent: number;
	scope: VoucherScope;
	scopeItemId?: number | null;
	validFrom?: string | null;
	validUntil?: string | null;
	maxUses?: number | null;
	maxUsesPerUser?: number | null;
	active: boolean;
}

export interface VoucherRedemption {
	id: number;
	userName: string;
	discountAmount: number;
	released: boolean;
	redeemedAt: string;
	appliedTo: string;
}

export const vouchersService = {
	getAll: (): Promise<Voucher[]> => api.get<Voucher[]>("/api/vouchers"),

	create: (data: VoucherInput): Promise<Voucher> => api.post<Voucher>("/api/vouchers", data),

	update: (id: number, data: VoucherInput): Promise<Voucher> => api.patch<Voucher>(`/api/vouchers/${id}`, data),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/vouchers/${id}`),

	getRedemptions: (id: number): Promise<VoucherRedemption[]> => api.get<VoucherRedemption[]>(`/api/vouchers/${id}/redemptions`),
};
