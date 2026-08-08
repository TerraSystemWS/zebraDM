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

export const testimonialsService = {
	getAll: (): Promise<Testimonial[]> => api.get<Testimonial[]>("/api/testimonials"),

	create: (input: TestimonialInput): Promise<Testimonial> => api.post<Testimonial>("/api/testimonials", input),

	update: (id: number, input: TestimonialInput): Promise<Testimonial> =>
		api.put<Testimonial>(`/api/testimonials/${id}`, input),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/testimonials/${id}`),
};
