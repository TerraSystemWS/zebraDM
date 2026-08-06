import { api } from "@/lib/api";

export interface DashboardStats {
	totalBookings: number;
	activeUsers: number;
	monthlyRevenue: number;
	avgFeedback: number | null;
	feedbackCount: number;
}

export const dashboardService = {
	getStats: (): Promise<DashboardStats> => api.get<DashboardStats>("/api/dashboard/stats"),
};
