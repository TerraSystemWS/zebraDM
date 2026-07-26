import { api } from "@/lib/api";

export interface User {
	id: number;
	name: string;
	email: string;
	role: string;
	status: string;
}

export interface UserInput {
	name: string;
	email: string;
	password?: string;
	role: string;
	status: string;
}

interface UserDto {
	id: number;
	name: string;
	email: string;
	role: string;
	status: string;
}

function fromDto(dto: UserDto): User {
	return { ...dto, status: dto.status === "ACTIVE" ? "Active" : "Inactive" };
}

function toDto(input: UserInput) {
	return {
		name: input.name,
		email: input.email,
		password: input.password || undefined,
		role: input.role,
		status: input.status === "Active" ? "ACTIVE" : "INACTIVE",
	};
}

export const usersService = {
	getAll: async (): Promise<User[]> => {
		const data = await api.get<UserDto[]>("/api/users");
		return data.map(fromDto);
	},

	create: async (input: UserInput): Promise<User> => {
		const dto = await api.post<UserDto>("/api/users", toDto(input));
		return fromDto(dto);
	},

	update: async (id: number, input: UserInput): Promise<User> => {
		const dto = await api.put<UserDto>(`/api/users/${id}`, toDto(input));
		return fromDto(dto);
	},

	delete: (id: number): Promise<void> => api.delete<void>(`/api/users/${id}`),
};
