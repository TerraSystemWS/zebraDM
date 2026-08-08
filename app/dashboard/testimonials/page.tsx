"use client";

import { useEffect, useState } from "react";
import { Testimonial, TestimonialInput, testimonialsService } from "@/services/testimonialsService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import Swal from "sweetalert2";

const emptyForm: TestimonialInput = {
	image: "",
	text: "",
	name: "",
	designation: "",
	rating: 5,
	backgroundImage: "",
	link: "",
};

const SOURCE_LABEL: Record<string, string> = {
	EXCURSION: "Gerado a partir de review de Excursão",
	HOTEL_ROOM: "Gerado a partir de review de Quarto",
};

export default function TestimonialsPage() {
	const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState<Testimonial | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<TestimonialInput>(emptyForm);

	useEffect(() => {
		load();
	}, []);

	const load = async () => {
		setLoading(true);
		try {
			const data = await testimonialsService.getAll();
			setTestimonials(data);
		} catch (error) {
			console.error("Error loading testimonials:", error);
			Swal.fire("Erro", "Erro ao carregar os testemunhos", "error");
		} finally {
			setLoading(false);
		}
	};

	const openEdit = (t: Testimonial) => {
		setEditing(t);
		setForm({
			image: t.image ?? "",
			text: t.text,
			name: t.name,
			designation: t.designation ?? "",
			rating: t.rating,
			backgroundImage: t.backgroundImage ?? "",
			link: t.link ?? "",
		});
		setShowForm(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editing) return;
		setSaving(true);
		try {
			await testimonialsService.update(editing.id, form);
			setShowForm(false);
			await load();
			Swal.fire("Sucesso", "Testemunho atualizado.", "success");
		} catch (error) {
			console.error("Error saving testimonial:", error);
			Swal.fire("Erro", "Não foi possível guardar o testemunho", "error");
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
				await testimonialsService.delete(id);
				setTestimonials(testimonials.filter((t) => t.id !== id));
				Swal.fire("Apagado!", "O testemunho foi removido.", "success");
			} catch (error) {
				console.error("Error deleting testimonial:", error);
				Swal.fire("Erro", "Erro ao apagar o testemunho", "error");
			}
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando testemunhos...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Testemunhos</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Mostrados no carrossel de testemunhos da home. Só podem ser criados pelos próprios clientes,
						a partir de uma review sua com reserva confirmada — aqui só é possível editar ou apagar.
					</p>
				</div>
			</div>

			{testimonials.length === 0 ? (
				<div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
					Ainda não há testemunhos.
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{testimonials.map((t) => (
						<div key={t.id} className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
							<div className="flex items-center gap-3">
								{t.image ? (
									<img src={t.image} alt="" className="h-10 w-10 rounded-full object-cover" />
								) : (
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffc933] text-sm font-semibold text-white">
										{t.name.charAt(0).toUpperCase()}
									</div>
								)}
								<div>
									<p className="font-semibold text-gray-800 dark:text-white">{t.name}</p>
									{t.designation && (
										<p className="text-xs text-gray-500 dark:text-gray-400">{t.designation}</p>
									)}
								</div>
							</div>
							<p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{t.text}</p>
							<p className="text-sm text-[#ffc933]">{"★".repeat(Math.round(t.rating))}</p>
							{t.sourceReviewType && (
								<span className="w-fit rounded-full bg-[#ffc933]/15 px-2 py-0.5 text-xs font-medium text-[#b8860b]">
									{SOURCE_LABEL[t.sourceReviewType] ?? "Gerado a partir de review"}
								</span>
							)}
							<div className="mt-2 flex gap-3 text-sm">
								<button
									className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
									onClick={() => openEdit(t)}
								>
									Editar
								</button>
								<button
									className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
									onClick={() => handleDelete(t.id)}
								>
									Apagar
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{showForm && (
				<Modal title="Editar Testemunho" onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
						<ImagePicker
							label="Foto (opcional)"
							value={form.image ?? ""}
							onChange={(url) => setForm({ ...form, image: url })}
						/>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
								Cargo/frase (opcional)
							</label>
							<input
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.designation ?? ""}
								onChange={(e) => setForm({ ...form, designation: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Texto</label>
							<textarea
								required
								rows={4}
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.text}
								onChange={(e) => setForm({ ...form, text: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Avaliação</label>
							<select
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.rating}
								onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
							>
								{[5, 4, 3, 2, 1].map((n) => (
									<option key={n} value={n}>
										{n}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
								Link (opcional)
							</label>
							<input
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.link ?? ""}
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
