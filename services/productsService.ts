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
	getAll: async (): Promise<Produto[]> => {
		const data = await api.get<ProductDto[]>("/api/products");
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
};
