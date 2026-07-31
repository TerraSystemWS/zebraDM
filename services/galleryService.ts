import { api } from "@/lib/api";

export interface GalleryItem {
	id: number;
	imgSrc: string;
	categories: string[];
}

export interface GalleryItemInput {
	imgSrc: string;
	categories: string[];
}

export const galleryService = {
	getAll: (): Promise<GalleryItem[]> => api.get<GalleryItem[]>("/api/gallery"),

	create: (input: GalleryItemInput): Promise<GalleryItem> => api.post<GalleryItem>("/api/gallery", input),

	update: (id: number, input: GalleryItemInput): Promise<GalleryItem> => api.put<GalleryItem>(`/api/gallery/${id}`, input),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/gallery/${id}`),
};
