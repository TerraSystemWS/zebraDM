import { api } from "@/lib/api";

export interface Testimonial {
	id: number;
	image: string | null;
	text: string;
	name: string;
	designation: string | null;
	rating: number;
	backgroundImage: string | null;
	link: string | null;
	sourceReviewType: "EXCURSION" | "HOTEL_ROOM" | null;
	sourceReviewId: number | null;
}

export type TestimonialInput = Omit<Testimonial, "id" | "sourceReviewType" | "sourceReviewId">;

// Sem create() de propósito — testemunhos só nascem de uma review real de cliente
// (POST /api/testimonials/from-review, chamado pelo zebratravel), nunca manualmente
// pelo admin/agente aqui. Editar/apagar continuam disponíveis para moderação.
export const testimonialsService = {
	getAll: (): Promise<Testimonial[]> => api.get<Testimonial[]>("/api/testimonials"),

	update: (id: number, input: TestimonialInput): Promise<Testimonial> =>
		api.put<Testimonial>(`/api/testimonials/${id}`, input),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/testimonials/${id}`),
};
