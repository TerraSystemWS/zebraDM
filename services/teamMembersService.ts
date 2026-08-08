import { api } from "@/lib/api";

export interface TeamMember {
	id: number;
	name: string;
	designation: string;
	image: string;
}

export type TeamMemberInput = Omit<TeamMember, "id">;

export const teamMembersService = {
	getAll: (): Promise<TeamMember[]> => api.get<TeamMember[]>("/api/team-members"),

	create: (input: TeamMemberInput): Promise<TeamMember> => api.post<TeamMember>("/api/team-members", input),

	update: (id: number, input: TeamMemberInput): Promise<TeamMember> => api.put<TeamMember>(`/api/team-members/${id}`, input),

	delete: (id: number): Promise<void> => api.delete<void>(`/api/team-members/${id}`),
};
