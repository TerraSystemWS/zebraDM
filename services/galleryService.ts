import { api } from "@/lib/api";

export interface GalleryItem {
	id: number;
	imgSrc: string;
	categories: string[];
	status: string;
}

export interface GalleryItemInput {
	imgSrc: string;
	categories: string[];
}

export const galleryService = {
	getAll: (includeArchived = false): Promise<GalleryItem[]> =>
		api.get<GalleryItem[]>(`/api/gallery${includeArchived ? "?includeArchived=true" : ""}`),

	create: (input: GalleryItemInput): Promise<GalleryItem> => api.post<GalleryItem>("/api/gallery", input),

	update: (id: number, input: GalleryItemInput): Promise<GalleryItem> => api.put<GalleryItem>(`/api/gallery/${id}`, input),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/gallery/${id}`),

	archive: (id: number): Promise<GalleryItem> => api.post<GalleryItem>(`/api/gallery/${id}/archive`, {}),

	restore: (id: number): Promise<GalleryItem> => api.post<GalleryItem>(`/api/gallery/${id}/restore`, {}),
};
