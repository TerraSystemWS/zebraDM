import { api, getToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface InvoiceLine {
	description: string;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
}

export interface Invoice {
	id: number;
	documentNumber: string;
	documentType: string;
	sourceType: "ORDER" | "EXCURSION_BOOKING" | "HOTEL_RESERVATION";
	sourceId: number;
	customerName: string;
	customerEmail: string | null;
	customerNif: string | null;
	currency: string;
	subtotal: number;
	totalAmount: number;
	status: string;
	createdAt: string;
	lines: InvoiceLine[];
}

export interface InvoiceCompanyProfile {
	name: string;
	legalName: string;
	nif: string;
	address: string;
	email: string;
	logoUrl: string | null;
}

export interface UpdateInvoiceCompanyProfileInput {
	name: string;
	legalName: string;
	nif: string;
	address: string;
	email: string;
}

export const invoicesService = {
	getAll: (): Promise<Invoice[]> => api.get<Invoice[]>("/api/invoices"),

	openPdf: async (id: number) => {
		const token = getToken();
		const res = await fetch(`${API_URL}/api/invoices/${id}/pdf`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		if (!res.ok) throw new Error("Não foi possível abrir a fatura");
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	},

	getCompanyProfile: (): Promise<InvoiceCompanyProfile> => api.get<InvoiceCompanyProfile>("/api/invoices/company-profile"),

	updateCompanyProfile: (input: UpdateInvoiceCompanyProfileInput): Promise<InvoiceCompanyProfile> =>
		api.put<InvoiceCompanyProfile>("/api/invoices/company-profile", input),

	uploadLogo: async (file: File): Promise<InvoiceCompanyProfile> => {
		const form = new FormData();
		form.append("file", file);

		const token = getToken();
		const res = await fetch(`${API_URL}/api/invoices/company-profile/logo`, {
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
};
