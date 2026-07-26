
"use client";

import { useEffect, useState } from "react";
import { Produto, ProdutoInput, productsService } from "@/services/productsService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import Swal from "sweetalert2";
import { getUser } from "@/lib/api";

const emptyForm: ProdutoInput = { titulo: "", price: 0, imagemUrl: "", link: "", categoria: "", estoque: 0 };

export default function LojaPage() {
	const [produtos, setProdutos] = useState<Produto[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState<Produto | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<ProdutoInput>(emptyForm);
	const currentUser = getUser();
	const canDelete = (createdById: number | null) =>
		currentUser?.role !== "AGENTE" || createdById === currentUser.id;

	useEffect(() => {
		loadProdutos();
	}, []);

	const loadProdutos = async () => {
		setLoading(true);
		try {
			const data = await productsService.getAll();
			setProdutos(data);
		} catch (error) {
			console.error("Error loading products:", error);
			Swal.fire("Erro", "Erro ao carregar produtos", "error");
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setShowForm(true);
	};

	const openEdit = (produto: Produto) => {
		setEditing(produto);
		setForm({
			titulo: produto.titulo,
			price: Number(produto.preco.replace(",", ".").replace(/[^0-9.]/g, "")) || 0,
			imagemUrl: produto.imagemUrl,
			link: produto.link,
			categoria: produto.categoria,
			estoque: produto.estoque,
		});
		setShowForm(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			if (editing) {
				await productsService.update(editing.id, form);
			} else {
				await productsService.create(form);
			}
			setShowForm(false);
			await loadProdutos();
			Swal.fire("Sucesso", editing ? "Produto atualizado." : "Produto criado.", "success");
		} catch (error) {
			console.error("Error saving product:", error);
			Swal.fire("Erro", "Não foi possível guardar o produto", "error");
		} finally {
			setSaving(false);
		}
	};

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Tem certeza?",
            text: "Você não poderá reverter isso!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, deletar!",
        });

        if (result.isConfirmed) {
            try {
                await productsService.delete(id);
                setProdutos(produtos.filter((p) => p.id !== id));
                Swal.fire("Deletado!", "O produto foi deletado.", "success");
            } catch (error) {
                console.error("Error deleting product:", error);
                Swal.fire("Erro", "Erro ao deletar produto", "error");
            }
        }
    };

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando produtos...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
					Gestão de Produtos (Loja)
				</h1>
				<button
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					onClick={openCreate}
				>
					Novo Produto
				</button>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Produto
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Preço
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Categoria
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Estoque
							</th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Ações
							</th>
						</tr>
					</thead>
					<tbody>
						{produtos.map((produto) => (
							<tr key={produto.id}>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                                            <img className="h-full w-full rounded-full object-cover" src={produto.imagemUrl} alt="" />
                                        </div>
                                        <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                            {produto.titulo}
                                        </p>
                                    </div>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<p className="whitespace-no-wrap text-gray-900 dark:text-white">
										{produto.preco}
									</p>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<span className="relative inline-block px-3 py-1 font-semibold text-purple-900 leading-tight">
                                        <span aria-hidden className="absolute inset-0 bg-purple-200 opacity-50 rounded-full"></span>
                                        <span className="relative">{produto.categoria}</span>
                                    </span>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<span className={produto.estoque > 0 ? "text-gray-900 dark:text-white" : "font-semibold text-red-600 dark:text-red-400"}>
										{produto.estoque}
									</span>
								</td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<div className="flex gap-2">
										<button
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            onClick={() => openEdit(produto)}
                                        >
											Editar
										</button>
										{canDelete(produto.createdById) && (
											<button
												className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
												onClick={() => handleDelete(produto.id)}
											>
												Deletar
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{showForm && (
				<Modal title={editing ? "Editar Produto" : "Novo Produto"} onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Título</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.titulo}
								onChange={(e) => setForm({ ...form, titulo: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Preço (€)</label>
							<input
								type="number"
								step="0.01"
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.price}
								onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Estoque</label>
							<input
								type="number"
								min="0"
								step="1"
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.estoque}
								onChange={(e) => setForm({ ...form, estoque: Number(e.target.value) })}
							/>
						</div>
						<ImagePicker
							label="Imagem"
							value={form.imagemUrl}
							onChange={(url) => setForm({ ...form, imagemUrl: url })}
						/>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Link</label>
							<input
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.link}
								onChange={(e) => setForm({ ...form, link: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Categoria</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.categoria}
								onChange={(e) => setForm({ ...form, categoria: e.target.value })}
							/>
						</div>
						<button
							type="submit"
							disabled={saving}
							className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
						>
							{saving ? "A guardar..." : "Guardar"}
						</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
