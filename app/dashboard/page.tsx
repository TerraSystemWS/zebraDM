"use client";

import { useEffect, useState } from "react";
import { DashboardStats, dashboardService } from "@/services/dashboardService";

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

export default function DashboardPage() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		dashboardService
			.getStats()
			.then(setStats)
			.catch((error) => console.error("Error loading dashboard stats:", error))
			.finally(() => setLoading(false));
	}, []);

	const cards = [
		{
			label: "Total de Reservas",
			value: loading ? "…" : stats?.totalBookings.toLocaleString("pt-PT") ?? "0",
		},
		{
			label: "Usuários Ativos",
			value: loading ? "…" : stats?.activeUsers.toLocaleString("pt-PT") ?? "0",
		},
		{
			label: "Receita Mensal",
			value: loading ? "…" : formatCurrency(stats?.monthlyRevenue ?? 0),
		},
		{
			label: "Feedback",
			value: loading
				? "…"
				: stats?.avgFeedback != null
					? `${stats.avgFeedback.toFixed(1)}/5`
					: "Sem dados",
		},
	];

	return (
		<div>
			<h2 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">
				Visão Geral
			</h2>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{cards.map((card) => (
					<div key={card.label} className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
						<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
							{card.label}
						</h3>
						<p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
							{card.value}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
