import { api } from "@/lib/api";

export interface Booking {
	id: number;
	user: string;
	userEmail: string | null;
	tour: string;
	date: string;
	status: "Pending" | "Confirmed" | "Cancelled";
	paymentStatus: "PAID" | "UNPAID";
	amount: number;
	excursionSlug: string | null;
	tourId: number | null;
	type: "EXCURSION" | "TOUR";
}

interface BookingDto {
	id: number;
	user: string;
	userEmail: string | null;
	item: string;
	date: string;
	status: string;
	paymentStatus: string;
	amount: number;
	excursionSlug: string | null;
	tourId: number | null;
	type: string;
}

const STATUS_MAP: Record<string, Booking["status"]> = {
	PENDING: "Pending",
	CONFIRMED: "Confirmed",
	CANCELLED: "Cancelled",
};

function fromDto(dto: BookingDto): Booking {
	return {
		id: dto.id,
		user: dto.user,
		userEmail: dto.userEmail,
		tour: dto.item,
		date: dto.date,
		status: STATUS_MAP[dto.status] ?? "Pending",
		paymentStatus: dto.paymentStatus === "PAID" ? "PAID" : "UNPAID",
		amount: dto.amount,
		excursionSlug: dto.excursionSlug,
		tourId: dto.tourId,
		type: dto.type === "TOUR" ? "TOUR" : "EXCURSION",
	};
}

export const bookingsService = {
	getAll: async (): Promise<Booking[]> => {
		const data = await api.get<BookingDto[]>("/api/bookings");
		return data.map(fromDto);
	},

	updateStatus: (id: number, status: string): Promise<void> =>
		api.patch<void>(`/api/bookings/${id}/status`, { status: status.toUpperCase() }),

	updatePaymentStatus: (id: number, paymentStatus: "PAID" | "UNPAID"): Promise<void> =>
		api.patch<void>(`/api/bookings/${id}/payment-status`, { paymentStatus }),
};
