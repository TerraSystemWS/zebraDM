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

export interface CounterSaleItemInput {
	productId: number;
	name: string;
	price: number;
	quantity: number;
}

export interface CreateCounterSaleInput {
	items: CounterSaleItemInput[];
	paymentMethod: "TRANSFER" | "CASH";
	guestName: string;
	guestEmail?: string;
	customerNif?: string;
	voucherCode?: string;
}

export const ordersService = {
	getAll: (): Promise<Order[]> => api.get<Order[]>("/api/orders"),

	updateFulfillmentStatus: (id: number, fulfillmentStatus: Order["fulfillmentStatus"]): Promise<Order> =>
		api.patch<Order>(`/api/orders/${id}/fulfillment-status`, { fulfillmentStatus }),

	// Fecha a lacuna de encomendas por Transferência/Dinheiro sem forma de serem marcadas
	// como pagas — emite a fatura no mesmo passo (ver InvoiceController).
	markPaid: (id: number): Promise<Order> => api.patch<Order>(`/api/orders/${id}/mark-paid`),

	counterSale: (input: CreateCounterSaleInput): Promise<Order> => api.post<Order>("/api/orders/counter-sale", input),
};
