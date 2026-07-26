import { api } from "@/lib/api";

export interface Booking {
	id: number;
	user: string;
	tour: string;
	date: string;
	status: "Pending" | "Confirmed" | "Cancelled";
	amount: number;
}

interface BookingDto {
	id: number;
	user: string;
	item: string;
	date: string;
	status: string;
	amount: number;
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
		tour: dto.item,
		date: dto.date,
		status: STATUS_MAP[dto.status] ?? "Pending",
		amount: dto.amount,
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
