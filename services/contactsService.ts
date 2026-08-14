import { api } from "@/lib/api";

export interface ContactMessage {
	id: number;
	name: string;
	email: string;
	phone: string | null;
	subject: string | null;
	message: string;
	read: boolean;
	createdAt: string;
}

export const contactsService = {
	getAll: (): Promise<ContactMessage[]> => api.get<ContactMessage[]>("/api/contact-messages"),

	getUnreadCount: (): Promise<number> =>
		api.get<{ count: number }>("/api/contact-messages/unread-count").then((r) => r.count),

	markRead: (id: number): Promise<ContactMessage> => api.patch<ContactMessage>(`/api/contact-messages/${id}/read`, {}),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/contact-messages/${id}`),
};
