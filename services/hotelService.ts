import { api } from "@/lib/api";

export interface Hotel {
	id: number;
	name: string;
	address: string | null;
	city: string | null;
	description: string | null;
	image: string | null;
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

export interface HotelAmenity {
	id: number;
	code: string;
	label: string;
	icon: string;
}

export const hotelService = {
	getHotels: (): Promise<Hotel[]> => api.get<Hotel[]>("/api/hotels"),
	createHotel: (data: Omit<Hotel, "id">): Promise<Hotel> => api.post<Hotel>("/api/hotels", data),
	updateHotel: (id: number, data: Omit<Hotel, "id">): Promise<Hotel> => api.put<Hotel>(`/api/hotels/${id}`, data),
	deleteHotel: (id: number): Promise<void> => api.delete<void>(`/api/hotels/${id}`),

	getRoomTypes: (hotelId: number): Promise<RoomType[]> => api.get<RoomType[]>(`/api/hotels/${hotelId}/room-types`),
	createRoomType: (hotelId: number, data: Omit<RoomType, "id" | "hotelId" | "createdBy">): Promise<RoomType> =>
		api.post<RoomType>(`/api/hotels/${hotelId}/room-types`, data),
	updateRoomType: (id: number, data: Omit<RoomType, "id" | "hotelId" | "createdBy">): Promise<RoomType> =>
		api.put<RoomType>(`/api/room-types/${id}`, data),
	deleteRoomType: (id: number): Promise<void> => api.delete<void>(`/api/room-types/${id}`),

	getRooms: (roomTypeId: number): Promise<Room[]> => api.get<Room[]>(`/api/room-types/${roomTypeId}/rooms`),
	createRoom: (roomTypeId: number, data: Omit<Room, "id" | "roomTypeId" | "createdBy">): Promise<Room> =>
		api.post<Room>(`/api/room-types/${roomTypeId}/rooms`, data),
	updateRoom: (id: number, data: Omit<Room, "id" | "roomTypeId" | "createdBy">): Promise<Room> =>
		api.put<Room>(`/api/rooms/${id}`, data),
	deleteRoom: (id: number): Promise<void> => api.delete<void>(`/api/rooms/${id}`),

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

	getAmenities: (): Promise<HotelAmenity[]> => api.get<HotelAmenity[]>("/api/hotel-amenities"),
	createAmenity: (data: Omit<HotelAmenity, "id">): Promise<HotelAmenity> => api.post<HotelAmenity>("/api/hotel-amenities", data),
	updateAmenity: (id: number, data: Omit<HotelAmenity, "id">): Promise<HotelAmenity> => api.put<HotelAmenity>(`/api/hotel-amenities/${id}`, data),
	deleteAmenity: (id: number): Promise<void> => api.delete<void>(`/api/hotel-amenities/${id}`),
};
