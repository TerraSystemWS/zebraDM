import { api } from "@/lib/api";

export interface Booking {
	id: number;
	user: string;
	userEmail: string | null;
	tour: string;
	date: string;
	// "Pending"/"Confirmed"/"Cancelled" (usados pelo select de alterar estado) ou, para excursões
	// pagas online, o estado bruto do backend (PENDING_PAYMENT/AWAITING_TRANSFER/AWAITING_CASH/FAILED).
	status: string;
	amount: number;
	excursionSlug: string | null;
	excursionGroupId: number | null;
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
	amount: number;
	excursionSlug: string | null;
	excursionGroupId: number | null;
	tourId: number | null;
	type: string;
}

const STATUS_MAP: Record<string, string> = {
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
		status: STATUS_MAP[dto.status] ?? dto.status,
		amount: dto.amount,
		excursionSlug: dto.excursionSlug,
		excursionGroupId: dto.excursionGroupId,
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
};
