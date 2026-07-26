
"use client";

import { useEffect, useState } from "react";
import { Excursao, excursoesService } from "@/services/excursoesService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import Swal from "sweetalert2";
import { getUser } from "@/lib/api";

const emptyForm = {
	slug: "",
	title: "",
	image: "",
	price: 0,
	duration: "",
	location: "",
	rating: 0,
	reviews: 0,
	description: "",
	categories: "",
};

function slugify(title: string) {
	return title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export default function ExcursoesPage() {
	const [excursoes, setExcursoes] = useState<Excursao[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState<Excursao | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const currentUser = getUser();
	const canDelete = (createdById?: number | null) =>
		currentUser?.role !== "AGENTE" || createdById === currentUser.id;

	useEffect(() => {
		loadExcursoes();
	}, []);

	const loadExcursoes = async () => {
		setLoading(true);
		try {
			const data = await excursoesService.getAll();
			setExcursoes(data);
		} catch (error) {
			console.error("Error loading excursions:", error);
			Swal.fire("Erro", "Erro ao carregar excursões", "error");
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setShowForm(true);
	};

	const openEdit = (excursao: Excursao) => {
		setEditing(excursao);
		setForm({
			slug: excursao.slug,
			title: excursao.title,
			image: excursao.image,
			price: excursao.price,
			duration: excursao.duration,
			location: excursao.location,
			rating: excursao.rating,
			reviews: excursao.reviews,
			description: excursao.description,
			categories: excursao.categories.join(", "),
		});
		setShowForm(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		const payload: Excursao = {
			slug: editing ? editing.slug : form.slug || slugify(form.title),
			title: form.title,
			image: form.image,
			price: Number(form.price),
			duration: form.duration,
			location: form.location,
			rating: Number(form.rating),
			reviews: Number(form.reviews),
			description: form.description,
			categories: form.categories.split(",").map((c) => c.trim()).filter(Boolean),
		};
		try {
			if (editing) {
				await excursoesService.update(editing.slug, payload);
			} else {
				await excursoesService.create(payload);
			}
			setShowForm(false);
			await loadExcursoes();
			Swal.fire("Sucesso", editing ? "Excursão atualizada." : "Excursão criada.", "success");
		} catch (error) {
			console.error("Error saving excursion:", error);
			Swal.fire("Erro", "Não foi possível guardar a excursão", "error");
		} finally {
			setSaving(false);
		}
	};

    const handleDelete = async (slug: string) => {
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
				await excursoesService.delete(slug);
				setExcursoes(excursoes.filter((e) => e.slug !== slug));
				Swal.fire("Deletado!", "A excursão foi deletada.", "success");
			} catch (error) {
				console.error("Error deleting excursion:", error);
				Swal.fire("Erro", "Erro ao deletar excursão", "error");
			}
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando excursões...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
					Gestão de Excursões
				</h1>
				<button
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					onClick={openCreate}
				>
					Nova Excursão
				</button>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Título
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Preço
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Duração
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Avaliação
							</th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Ações
							</th>
						</tr>
					</thead>
					<tbody>
						{excursoes.map((excursao) => (
							<tr key={excursao.slug + excursao.title}>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                                            <img className="h-full w-full rounded-full object-cover" src={excursao.image} alt="" />
                                        </div>
										<p className="whitespace-no-wrap text-gray-900 dark:text-white">
											{excursao.title}
										</p>
									</div>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<p className="whitespace-no-wrap text-gray-900 dark:text-white">
										${excursao.price}
									</p>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<p className="whitespace-no-wrap text-gray-900 dark:text-white">
										{excursao.duration}
									</p>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                        <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                        <span className="relative">{excursao.rating} ★</span>
                                    </span>
								</td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<div className="flex gap-2">
										<button
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            onClick={() => openEdit(excursao)}
                                        >
											Editar
										</button>
										{canDelete(excursao.createdById) && (
											<button
												className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
												onClick={() => handleDelete(excursao.slug)}
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
				<Modal title={editing ? "Editar Excursão" : "Nova Excursão"} onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Título</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.title}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
							/>
						</div>
						{!editing && (
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Slug (opcional, gerado do título se vazio)</label>
								<input
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.slug}
									onChange={(e) => setForm({ ...form, slug: e.target.value })}
								/>
							</div>
						)}
						<ImagePicker
							label="Imagem"
							value={form.image}
							onChange={(url) => setForm({ ...form, image: url })}
						/>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Preço ($)</label>
								<input
									type="number"
									required
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.price}
									onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Duração</label>
								<input
									required
									placeholder="5 days"
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.duration}
									onChange={(e) => setForm({ ...form, duration: e.target.value })}
								/>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Localização</label>
							<input
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.location}
								onChange={(e) => setForm({ ...form, location: e.target.value })}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Avaliação (0-5)</label>
								<input
									type="number"
									step="0.1"
									min="0"
									max="5"
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.rating}
									onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nº de Avaliações</label>
								<input
									type="number"
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.reviews}
									onChange={(e) => setForm({ ...form, reviews: Number(e.target.value) })}
								/>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Categorias (separadas por vírgula)</label>
							<input
								placeholder="easy-m, popular"
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.categories}
								onChange={(e) => setForm({ ...form, categories: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Descrição</label>
							<textarea
								required
								rows={3}
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
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
