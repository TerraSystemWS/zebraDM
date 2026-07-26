import { api, getToken } from "@/lib/api";

export interface MediaFolder {
	id: number;
	name: string;
	parentId: number | null;
}

export interface MediaItem {
	id: number;
	folderId: number | null;
	name: string;
	url: string;
	contentType: string | null;
	sizeBytes: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const mediaService = {
	getFolders: (): Promise<MediaFolder[]> => api.get<MediaFolder[]>("/api/media/folders"),

	createFolder: (name: string, parentId: number | null): Promise<MediaFolder> =>
		api.post<MediaFolder>("/api/media/folders", { name, parentId }),

	deleteFolder: (id: number): Promise<void> => api.delete<void>(`/api/media/folders/${id}`),

	getItems: (folderId: number | null): Promise<MediaItem[]> =>
		api.get<MediaItem[]>(`/api/media/items${folderId != null ? `?folderId=${folderId}` : ""}`),

	deleteItem: (id: number): Promise<void> => api.delete<void>(`/api/media/items/${id}`),

	upload: async (file: File, folderId: number | null): Promise<MediaItem> => {
		const form = new FormData();
		form.append("file", file);
		if (folderId != null) form.append("folderId", String(folderId));

		const token = getToken();
		const res = await fetch(`${API_URL}/api/media/upload`, {
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
