import { api } from "@/lib/api";

export interface Post {
	id: number;
	title: string;
	author: string;
	date: string;
	image: string;
	content: string;
	category: string;
	description: string;
	slug: string;
	createdById?: number | null;
	status: string;
}

export interface PostInput {
	title: string;
	author: string;
	date?: string;
	image: string;
	content: string;
	category: string;
	description: string;
	slug?: string;
}

export const postsService = {
	getAll: (includeArchived = false): Promise<Post[]> =>
		api.get<Post[]>(`/api/posts${includeArchived ? "?includeArchived=true" : ""}`),

	create: (input: PostInput): Promise<Post> => api.post<Post>("/api/posts", input),

	update: (id: number, input: PostInput): Promise<Post> => api.put<Post>(`/api/posts/${id}`, input),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/posts/${id}`),

	archive: (id: number): Promise<Post> => api.post<Post>(`/api/posts/${id}/archive`, {}),

	restore: (id: number): Promise<Post> => api.post<Post>(`/api/posts/${id}/restore`, {}),
};
