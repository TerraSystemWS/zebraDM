"use client";

import { useEffect, useState } from "react";
import { Sponsor, SponsorInput, sponsorsService } from "@/services/sponsorsService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import Swal from "sweetalert2";

const emptyForm: SponsorInput = { image: "", link: "" };

export default function SponsorsPage() {
	const [sponsors, setSponsors] = useState<Sponsor[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState<Sponsor | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<SponsorInput>(emptyForm);

	useEffect(() => {
		loadSponsors();
	}, []);

	const loadSponsors = async () => {
		setLoading(true);
		try {
			const data = await sponsorsService.getAll();
			setSponsors(data);
		} catch (error) {
			console.error("Error loading sponsors:", error);
			Swal.fire("Erro", "Erro ao carregar os patrocinadores", "error");
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setShowForm(true);
	};

	const openEdit = (sponsor: Sponsor) => {
		setEditing(sponsor);
		setForm({ image: sponsor.image, link: sponsor.link });
		setShowForm(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			if (editing) {
				await sponsorsService.update(editing.id, form);
			} else {
				await sponsorsService.create(form);
			}
			setShowForm(false);
			await loadSponsors();
			Swal.fire("Sucesso", editing ? "Patrocinador atualizado." : "Patrocinador adicionado.", "success");
		} catch (error) {
			console.error("Error saving sponsor:", error);
			Swal.fire("Erro", "Não foi possível guardar o patrocinador", "error");
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
			confirmButtonText: "Sim, apagar!",
		});

		if (result.isConfirmed) {
			try {
				await sponsorsService.delete(id);
				setSponsors(sponsors.filter((s) => s.id !== id));
				Swal.fire("Apagado!", "O patrocinador foi removido.", "success");
			} catch (error) {
				console.error("Error deleting sponsor:", error);
				Swal.fire("Erro", "Erro ao apagar o patrocinador", "error");
			}
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando patrocinadores...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Patrocinadores</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Mostrados na secção de patrocinadores da home do site público.
					</p>
				</div>
				<button
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					onClick={openCreate}
				>
					+ Adicionar Patrocinador
				</button>
			</div>

			{sponsors.length === 0 ? (
				<div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
					Ainda não há patrocinadores.
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{sponsors.map((sponsor) => (
						<div key={sponsor.id} className="rounded-lg bg-white shadow dark:bg-gray-800">
							<div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-t-lg bg-gray-100 p-4 dark:bg-gray-700">
								<img src={sponsor.image} alt="" className="max-h-full max-w-full object-contain" />
							</div>
							<div className="p-3">
								<p className="truncate text-xs text-gray-500 dark:text-gray-400">{sponsor.link}</p>
								<div className="mt-2 flex gap-3 text-sm">
									<button
										className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
										onClick={() => openEdit(sponsor)}
									>
										Editar
									</button>
									<button
										className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
										onClick={() => handleDelete(sponsor.id)}
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
				<Modal title={editing ? "Editar Patrocinador" : "Novo Patrocinador"} onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
						<ImagePicker
							label="Logótipo"
							value={form.image}
							onChange={(url) => setForm({ ...form, image: url })}
						/>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Link</label>
							<input
								required
								placeholder="https://..."
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.link}
								onChange={(e) => setForm({ ...form, link: e.target.value })}
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
