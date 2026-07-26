import { api } from "@/lib/api";

export const settingsService = {
	getMaintenanceMode: async (): Promise<number> => {
		const data = await api.get<{ mode: number }>("/api/settings/maintenance");
		return data.mode;
	},

	setMaintenanceMode: async (mode: number): Promise<void> => {
		await api.put<{ mode: number }>("/api/settings/maintenance", { mode });
	},
};
