import { api } from "@/lib/api";

export const settingsService = {
	getMaintenanceMode: async (): Promise<number> => {
		const data = await api.get<{ mode: number }>("/api/settings/maintenance");
		return data.mode;
	},

	setMaintenanceMode: async (mode: number): Promise<void> => {
		await api.put<{ mode: number }>("/api/settings/maintenance", { mode });
	},

	getNotificationSoundEnabled: async (): Promise<boolean> => {
		const data = await api.get<{ enabled: number }>("/api/settings/notification-sound");
		return data.enabled === 1;
	},

	setNotificationSoundEnabled: async (enabled: boolean): Promise<void> => {
		await api.put<{ enabled: number }>("/api/settings/notification-sound", { enabled: enabled ? 1 : 0 });
	},
};
