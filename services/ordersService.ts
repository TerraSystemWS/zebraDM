import { api } from "@/lib/api";

export interface OrderItem {
	name: string;
	price: number;
	quantity: number;
}

export interface Order {
	id: number;
	userName: string;
	userEmail: string | null;
	totalAmount: number;
	paymentMethod: string;
	status: string;
	fulfillmentStatus: "PENDING_SHIPMENT" | "SHIPPED" | "DELIVERED";
	createdAt: string;
	items: OrderItem[];
}

export const ordersService = {
	getAll: (): Promise<Order[]> => api.get<Order[]>("/api/orders"),

	updateFulfillmentStatus: (id: number, fulfillmentStatus: Order["fulfillmentStatus"]): Promise<Order> =>
		api.patch<Order>(`/api/orders/${id}/fulfillment-status`, { fulfillmentStatus }),
};
