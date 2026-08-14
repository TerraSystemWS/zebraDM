import { api, getToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Hotel {
	id: number;
	name: string;
	address: string | null;
	city: string | null;
	description: string | null;
	image: string | null;
	status: string;
}

export interface RoomType {
	id: number;
	hotelId: number;
	name: string;
	description: string | null;
	basePrice: number;
	capacity: number;
	image: string | null;
	createdBy: number | null;
	status: string;
}

export interface Room {
	id: number;
	roomTypeId: number;
	roomNumber: string;
	floor: string | null;
	status: string;
	images: string[];
	amenities: string[];
	createdBy: number | null;
}

export interface Reservation {
	id: number;
	hotelId: number;
	hotelName: string;
	roomId: number | null;
	roomNumber: string | null;
	roomTypeName: string | null;
	roomImage: string | null;
	guestName: string;
	checkIn: string;
	checkOut: string;
	guests: number;
	totalAmount: number;
	paymentMethod: string;
	status: string;
	checkedInAt: string | null;
	checkedOutAt: string | null;
}

export interface ReservationGuestDocument {
	id: number;
	originalFilename: string;
	contentType: string;
	sizeBytes: number;
	uploadedAt: string;
}

export interface ReservationGuest {
	id: number;
	fullName: string;
	dateOfBirth: string | null;
	nationality: string | null;
	passportNumber: string | null;
	isPrimary: boolean;
	documents: ReservationGuestDocument[];
}

export interface HotelAmenity {
	id: number;
	code: string;
	label: string;
	icon: string;
}

export const hotelService = {
	getHotels: (includeArchived = false): Promise<Hotel[]> =>
		api.get<Hotel[]>(`/api/hotels${includeArchived ? "?includeArchived=true" : ""}`),
	createHotel: (data: Omit<Hotel, "id" | "status">): Promise<Hotel> => api.post<Hotel>("/api/hotels", data),
	updateHotel: (id: number, data: Omit<Hotel, "id" | "status">): Promise<Hotel> => api.put<Hotel>(`/api/hotels/${id}`, data),
	deleteHotel: (id: number): Promise<void> => api.delete<void>(`/api/hotels/${id}`),
	archiveHotel: (id: number): Promise<Hotel> => api.post<Hotel>(`/api/hotels/${id}/archive`, {}),
	restoreHotel: (id: number): Promise<Hotel> => api.post<Hotel>(`/api/hotels/${id}/restore`, {}),

	getRoomTypes: (hotelId: number, includeArchived = false): Promise<RoomType[]> =>
		api.get<RoomType[]>(`/api/hotels/${hotelId}/room-types${includeArchived ? "?includeArchived=true" : ""}`),
	createRoomType: (hotelId: number, data: Omit<RoomType, "id" | "hotelId" | "createdBy" | "status">): Promise<RoomType> =>
		api.post<RoomType>(`/api/hotels/${hotelId}/room-types`, data),
	updateRoomType: (id: number, data: Omit<RoomType, "id" | "hotelId" | "createdBy" | "status">): Promise<RoomType> =>
		api.put<RoomType>(`/api/room-types/${id}`, data),
	deleteRoomType: (id: number): Promise<void> => api.delete<void>(`/api/room-types/${id}`),
	archiveRoomType: (id: number): Promise<RoomType> => api.post<RoomType>(`/api/room-types/${id}/archive`, {}),
	restoreRoomType: (id: number): Promise<RoomType> => api.post<RoomType>(`/api/room-types/${id}/restore`, {}),

	getRooms: (roomTypeId: number, includeArchived = false): Promise<Room[]> =>
		api.get<Room[]>(`/api/room-types/${roomTypeId}/rooms${includeArchived ? "?includeArchived=true" : ""}`),
	createRoom: (roomTypeId: number, data: Omit<Room, "id" | "roomTypeId" | "createdBy">): Promise<Room> =>
		api.post<Room>(`/api/room-types/${roomTypeId}/rooms`, data),
	updateRoom: (id: number, data: Omit<Room, "id" | "roomTypeId" | "createdBy">): Promise<Room> =>
		api.put<Room>(`/api/rooms/${id}`, data),
	deleteRoom: (id: number): Promise<void> => api.delete<void>(`/api/rooms/${id}`),
	archiveRoom: (id: number): Promise<Room> => api.post<Room>(`/api/rooms/${id}/archive`, {}),
	restoreRoom: (id: number): Promise<Room> => api.post<Room>(`/api/rooms/${id}/restore`, {}),

	getReservations: (hotelId: number, from?: string, to?: string): Promise<Reservation[]> => {
		const params = new URLSearchParams({ hotelId: String(hotelId) });
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		return api.get<Reservation[]>(`/api/hotel/reservations?${params.toString()}`);
	},

	createReservationAsAdmin: (data: {
		roomId: number;
		guestName: string;
		guestEmail?: string;
		guestPhone?: string;
		checkIn: string;
		checkOut: string;
		guests: number;
		paymentMethod: string;
		status?: string;
	}): Promise<Reservation> => api.post<Reservation>("/api/hotel/reservations/admin", data),

	updateReservationStatus: (id: number, status: string): Promise<Reservation> =>
		api.patch<Reservation>(`/api/hotel/reservations/${id}/status`, { status }),

	updateReservationDates: (id: number, checkIn: string, checkOut: string): Promise<Reservation> =>
		api.patch<Reservation>(`/api/hotel/reservations/${id}/dates`, { checkIn, checkOut }),

	checkIn: (id: number): Promise<Reservation> => api.patch<Reservation>(`/api/hotel/reservations/${id}/checkin`, {}),
	checkOut: (id: number): Promise<Reservation> => api.patch<Reservation>(`/api/hotel/reservations/${id}/checkout`, {}),
	deleteReservation: (id: number): Promise<void> => api.delete<void>(`/api/hotel/reservations/${id}`),

	getReservationGuests: (reservationId: number): Promise<ReservationGuest[]> =>
		api.get<ReservationGuest[]>(`/api/hotel/reservations/${reservationId}/guests`),

	addReservationGuest: (
		reservationId: number,
		data: { fullName: string; dateOfBirth?: string; nationality?: string; passportNumber?: string; isPrimary?: boolean }
	): Promise<ReservationGuest> => api.post<ReservationGuest>(`/api/hotel/reservations/${reservationId}/guests`, data),

	deleteReservationGuest: (reservationId: number, guestId: number): Promise<void> =>
		api.delete<void>(`/api/hotel/reservations/${reservationId}/guests/${guestId}`),

	uploadGuestDocument: async (reservationId: number, guestId: number, file: File): Promise<ReservationGuestDocument> => {
		const form = new FormData();
		form.append("file", file);
		const token = getToken();
		const res = await fetch(`${API_URL}/api/hotel/reservations/${reservationId}/guests/${guestId}/documents`, {
			method: "POST",
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			body: form,
		});
		if (!res.ok) {
			let message = `Erro ${res.status}`;
			try {
				const body = await res.json();
				message = body.message || message;
			} catch {
				// ignore
			}
			throw new Error(message);
		}
		return res.json();
	},

	deleteGuestDocument: (reservationId: number, guestId: number, docId: number): Promise<void> =>
		api.delete<void>(`/api/hotel/reservations/${reservationId}/guests/${guestId}/documents/${docId}`),

	downloadGuestDocument: async (reservationId: number, guestId: number, docId: number): Promise<Blob> => {
		const token = getToken();
		const res = await fetch(`${API_URL}/api/hotel/reservations/${reservationId}/guests/${guestId}/documents/${docId}`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		if (!res.ok) throw new Error(`Erro ${res.status}`);
		return res.blob();
	},

	getAmenities: (): Promise<HotelAmenity[]> => api.get<HotelAmenity[]>("/api/hotel-amenities"),
	createAmenity: (data: Omit<HotelAmenity, "id">): Promise<HotelAmenity> => api.post<HotelAmenity>("/api/hotel-amenities", data),
	updateAmenity: (id: number, data: Omit<HotelAmenity, "id">): Promise<HotelAmenity> => api.put<HotelAmenity>(`/api/hotel-amenities/${id}`, data),
	deleteAmenity: (id: number): Promise<void> => api.delete<void>(`/api/hotel-amenities/${id}`),
};
