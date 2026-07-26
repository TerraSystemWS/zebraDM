import { api } from "@/lib/api";

export const contentService = {
	getAllContent: (): Promise<any> => api.get<any>("/api/content"),

	updateContent: async (content: any): Promise<{ success: boolean; error?: unknown }> => {
		try {
			await api.put<any>("/api/content", content);
			return { success: true };
		} catch (error) {
			return { success: false, error };
		}
	},
};
