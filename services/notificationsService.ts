import { api, getToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type NotificationType = "HOTEL_RESERVATION" | "EXCURSION_BOOKING" | "CONTACT_MESSAGE" | "REVIEW" | "JOB_APPLICATION";

export interface Notification {
	id: number;
	type: NotificationType;
	title: string;
	body: string | null;
	linkUrl: string | null;
	relatedEntityId: number | null;
	read: boolean;
	createdAt: string;
}

export const notificationsService = {
	getAll: (): Promise<Notification[]> => api.get<Notification[]>("/api/notifications"),

	getUnreadCount: (): Promise<number> =>
		api.get<{ count: number }>("/api/notifications/unread-count").then((r) => r.count),

	markRead: (id: number): Promise<void> => api.patch<void>(`/api/notifications/${id}/read`),

	markAllRead: (): Promise<void> => api.patch<void>("/api/notifications/read-all"),

	// EventSource não permite definir o header Authorization — o token vai por query param,
	// só nesta rota (ver JwtAuthFilter no backend).
	connect: (onNotification: (n: Notification) => void): EventSource | null => {
		const token = getToken();
		if (!token) return null;
		const source = new EventSource(`${API_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`);
		source.addEventListener("notification", (event: MessageEvent) => {
			try {
				onNotification(JSON.parse(event.data) as Notification);
			} catch {
				// ignore malformed events
			}
		});
		return source;
	},
};
