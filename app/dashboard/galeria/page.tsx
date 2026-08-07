"use client";

import { useEffect, useState } from "react";
import { GalleryItem, GalleryItemInput, galleryService } from "@/services/galleryService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import Swal from "sweetalert2";

const KNOWN_CATEGORIES: { value: string; label: string }[] = [
	{ value: "activity", label: "Atividades" },
	{ value: "destination", label: "Destinos" },
	{ value: "tours", label: "Excursões" },
];

interface FormState {
	imgSrc: string;
	known: string[];
	extra: string;
}

const emptyForm: FormState = { imgSrc: "", known: [], extra: "" };

function toInput(form: FormState): GalleryItemInput {
	const extraCategories = form.extra
		.split(",")
		.map((c) => c.trim())
		.filter(Boolean);
	return { imgSrc: form.imgSrc, categories: [...form.known, ...extraCategories] };
}

function toForm(item: GalleryItem): FormState {
	const knownValues = KNOWN_CATEGORIES.map((c) => c.value);
	return {
		imgSrc: item.imgSrc,
		known: item.categories.filter((c) => knownValues.includes(c)),
		extra: item.categories.filter((c) => !knownValues.includes(c)).join(", "),
	};
}

export default function GaleriaPage() {
	const [items, setItems] = useState<GalleryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState<GalleryItem | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [showArchived, setShowArchived] = useState(false);

	useEffect(() => {
		loadItems();
	}, [showArchived]);

	const loadItems = async () => {
		setLoading(true);
		try {
			const data = await galleryService.getAll(showArchived);
			setItems(data);
		} catch (error) {
			console.error("Error loading gallery:", error);
			Swal.fire("Erro", "Erro ao carregar a galeria", "error");
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setShowForm(true);
	};

	const openEdit = (item: GalleryItem) => {
		setEditing(item);
		setForm(toForm(item));
		setShowForm(true);
	};

	const toggleKnown = (value: string) => {
		setForm((f) => ({
			...f,
			known: f.known.includes(value) ? f.known.filter((v) => v !== value) : [...f.known, value],
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.imgSrc) {
			Swal.fire("Erro", "Escolhe uma imagem antes de guardar", "error");
			return;
		}
		setSaving(true);
		try {
			const input = toInput(form);
			if (editing) {
				await galleryService.update(editing.id, input);
			} else {
				await galleryService.create(input);
			}
			setShowForm(false);
			await loadItems();
			Swal.fire("Sucesso", editing ? "Imagem atualizada." : "Imagem adicionada.", "success");
		} catch (error) {
			console.error("Error saving gallery item:", error);
			Swal.fire("Erro", "Não foi possível guardar a imagem", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: number) => {
		const result = await Swal.fire({
			title: "Tem certeza?",
			text: "Esta imagem deixará de aparecer na Galeria do site.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "Sim, apagar!",
		});

		if (result.isConfirmed) {
			try {
				await galleryService.delete(id);
				setItems(items.filter((i) => i.id !== id));
				Swal.fire("Apagada!", "A imagem foi removida da galeria.", "success");
			} catch (error) {
				console.error("Error deleting gallery item:", error);
				Swal.fire("Erro", "Erro ao apagar a imagem", "error");
			}
		}
	};

	const handleArchive = async (id: number) => {
		try {
			await galleryService.archive(id);
			await loadItems();
			Swal.fire("Arquivada!", "A imagem foi arquivada.", "success");
		} catch (error) {
			console.error("Error archiving gallery item:", error);
			Swal.fire("Erro", "Erro ao arquivar a imagem", "error");
		}
	};

	const handleRestore = async (id: number) => {
		try {
			await galleryService.restore(id);
			await loadItems();
			Swal.fire("Restaurada!", "A imagem foi restaurada.", "success");
		} catch (error) {
			console.error("Error restoring gallery item:", error);
			Swal.fire("Erro", "Erro ao restaurar a imagem", "error");
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando galeria...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Galeria</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Imagens mostradas na página pública "Galeria" do site.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-4">
					<label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
						<input
							type="checkbox"
							checked={showArchived}
							onChange={(e) => setShowArchived(e.target.checked)}
						/>
						Mostrar arquivadas
					</label>
					<button
						className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
						onClick={openCreate}
					>
						+ Adicionar Imagem
					</button>
				</div>
			</div>

			{items.length === 0 ? (
				<div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
					Ainda não há imagens na galeria.
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{items.map((item) => (
						<div
							key={item.id}
							className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800"
						>
							<div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-700">
								<img
									src={item.imgSrc}
									alt=""
									className="h-full w-full object-cover"
								/>
								{item.status === "ARCHIVED" && (
									<span className="absolute left-2 top-2 rounded-full bg-gray-800/80 px-2 py-0.5 text-xs text-white">
										Arquivada
									</span>
								)}
							</div>
							<div className="p-3">
								<div className="mb-2 flex flex-wrap gap-1">
									{item.categories.length === 0 ? (
										<span className="text-xs text-gray-400">Sem categoria</span>
									) : (
										item.categories.map((c) => (
											<span
												key={c}
												className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
											>
												{c}
											</span>
										))
									)}
								</div>
								<div className="flex flex-wrap gap-3 text-sm">
									<button
										className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
										onClick={() => openEdit(item)}
									>
										Editar
									</button>
									{item.status === "ARCHIVED" ? (
										<button
											className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
											onClick={() => handleRestore(item.id)}
										>
											Restaurar
										</button>
									) : (
										<button
											className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
											onClick={() => handleArchive(item.id)}
										>
											Arquivar
										</button>
									)}
									<button
										className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
										onClick={() => handleDelete(item.id)}
									>
										Apagar
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{showForm && (
				<Modal title={editing ? "Editar Imagem" : "Nova Imagem"} onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
						<ImagePicker
							label="Imagem"
							value={form.imgSrc}
							onChange={(url) => setForm({ ...form, imgSrc: url })}
						/>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
								Categorias
							</label>
							<div className="flex flex-wrap gap-3">
								{KNOWN_CATEGORIES.map((c) => (
									<label key={c.value} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
										<input
											type="checkbox"
											checked={form.known.includes(c.value)}
											onChange={() => toggleKnown(c.value)}
										/>
										{c.label}
									</label>
								))}
							</div>
							<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
								Estas três correspondem aos filtros já existentes na página pública.
							</p>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
								Outras categorias (opcional, separadas por vírgula)
							</label>
							<input
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								placeholder="ex: praia, gastronomia"
								value={form.extra}
								onChange={(e) => setForm({ ...form, extra: e.target.value })}
							/>
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Categorias extra não aparecem nos botões de filtro do site (que são fixos), mas ficam guardadas na imagem.
							</p>
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
