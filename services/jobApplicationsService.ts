import { api, getToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface JobApplication {
	id: number;
	name: string;
	phone: string;
	email: string;
	area: string;
	description: string;
	cvOriginalFilename: string;
	createdAt: string;
}

export const JOB_AREAS = [
	"Contabilidade",
	"Agente de Viagem",
	"Restaurante",
	"Bar",
	"Atendente de Mesas",
	"Limpeza",
	"Condutor",
	"Informático",
	"Marketing Digital",
	"Guia Turístico",
];

export const jobApplicationsService = {
	getAll: (): Promise<JobApplication[]> => api.get<JobApplication[]>("/api/job-applications"),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/job-applications/${id}`),

	cvUrl: (id: number): string => `${API_URL}/api/job-applications/${id}/cv`,

	openCv: async (id: number) => {
		const token = getToken();
		const res = await fetch(`${API_URL}/api/job-applications/${id}/cv`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		if (!res.ok) throw new Error("Não foi possível abrir o CV");
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	},
};
