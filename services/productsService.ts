import { api } from "@/lib/api";

export interface Produto {
	id: number;
	imagemUrl: string;
	titulo: string;
	preco: string;
	link: string;
	categoria: string;
	estoque: number;
	createdById: number | null;
	status: string;
}

export interface ProdutoInput {
	titulo: string;
	price: number;
	imagemUrl: string;
	link: string;
	categoria: string;
	estoque: number;
}

interface ProductDto {
	id: number;
	title: string;
	price: number;
	imageUrl: string;
	link: string;
	category: string | null;
	stockQuantity: number;
	createdById: number | null;
	status: string;
}

function fromDto(dto: ProductDto): Produto {
	return {
		id: dto.id,
		imagemUrl: dto.imageUrl,
		titulo: dto.title,
		preco: `${dto.price.toFixed(2)}€`,
		link: dto.link,
		categoria: dto.category ?? "",
		estoque: dto.stockQuantity ?? 0,
		createdById: dto.createdById,
		status: dto.status,
	};
}

function toDto(input: ProdutoInput) {
	return {
		title: input.titulo,
		price: input.price,
		imageUrl: input.imagemUrl,
		link: input.link,
		category: input.categoria,
		stockQuantity: input.estoque,
	};
}

export const productsService = {
	getAll: async (includeArchived = false): Promise<Produto[]> => {
		const data = await api.get<ProductDto[]>(`/api/products${includeArchived ? "?includeArchived=true" : ""}`);
		return data.map(fromDto);
	},

	create: async (input: ProdutoInput): Promise<Produto> => {
		const dto = await api.post<ProductDto>("/api/products", toDto(input));
		return fromDto(dto);
	},

	update: async (id: number, input: ProdutoInput): Promise<Produto> => {
		const dto = await api.put<ProductDto>(`/api/products/${id}`, toDto(input));
		return fromDto(dto);
	},

	delete: (id: number): Promise<void> => api.delete<void>(`/api/products/${id}`),

	archive: async (id: number): Promise<Produto> => {
		const dto = await api.post<ProductDto>(`/api/products/${id}/archive`, {});
		return fromDto(dto);
	},

	restore: async (id: number): Promise<Produto> => {
		const dto = await api.post<ProductDto>(`/api/products/${id}/restore`, {});
		return fromDto(dto);
	},
};
