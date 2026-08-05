"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { HotelAmenity, hotelService } from "@/services/hotelService";
import Modal from "@/components/Modal";

const emptyForm = { code: "", label: "", icon: "" };

export default function HotelComodidadesPage() {
	const [amenities, setAmenities] = useState<HotelAmenity[]>([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState<typeof emptyForm | null>(null);
	const [editing, setEditing] = useState<HotelAmenity | null>(null);

	useEffect(() => {
		load();
	}, []);

	const load = async () => {
		setLoading(true);
		try {
			setAmenities(await hotelService.getAmenities());
		} catch (error) {
			console.error(error);
			Swal.fire("Erro", "Erro ao carregar comodidades", "error");
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
	};

	const openEdit = (amenity: HotelAmenity) => {
		setEditing(amenity);
		setForm({ code: amenity.code, label: amenity.label, icon: amenity.icon });
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form) return;
		try {
			if (editing) await hotelService.updateAmenity(editing.id, form);
			else await hotelService.createAmenity(form);
			setForm(null);
			await load();
			Swal.fire("Sucesso", "Comodidade guardada.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar", "error");
		}
	};

	const remove = async (amenity: HotelAmenity) => {
		const result = await Swal.fire({ title: `Apagar "${amenity.label}"?`, icon: "warning", showCancelButton: true, confirmButtonText: "Sim, apagar!" });
		if (result.isConfirmed) {
			try {
				await hotelService.deleteAmenity(amenity.id);
				await load();
			} catch (error) {
				Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível apagar (pode estar em uso)", "error");
			}
		}
	};

	if (loading) return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando...</div>;

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Comodidades</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Catálogo de comodidades disponível para associar aos quartos em &quot;Editar/Configurar&quot;.
					</p>
				</div>
				<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={openCreate}>
					Nova Comodidade
				</button>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							{["Ícone", "Código", "Nome", "Ações"].map((h) => (
								<th key={h} className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{amenities.map((amenity) => (
							<tr key={amenity.id}>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									<i className={`fa-solid ${amenity.icon}`}></i>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">{amenity.code}</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">{amenity.label}</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
									<button className="mr-3 text-blue-600 hover:text-blue-900" onClick={() => openEdit(amenity)}>Editar</button>
									<button className="text-red-600 hover:text-red-900" onClick={() => remove(amenity)}>Apagar</button>
								</td>
							</tr>
						))}
						{amenities.length === 0 && (
							<tr>
								<td colSpan={4} className="px-5 py-6 text-center text-sm text-gray-500 dark:bg-gray-800">Nenhuma comodidade criada.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{form && (
				<Modal title={editing ? "Editar Comodidade" : "Nova Comodidade"} onClose={() => setForm(null)}>
					<form onSubmit={submit} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Código (único)</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.code}
								onChange={(e) => setForm({ ...form, code: e.target.value })}
								placeholder="ex: WIFI"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.label}
								onChange={(e) => setForm({ ...form, label: e.target.value })}
								placeholder="ex: Wi-Fi"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Ícone (Font Awesome)</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.icon}
								onChange={(e) => setForm({ ...form, icon: e.target.value })}
								placeholder="ex: fa-wifi"
							/>
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Nome da classe do ícone em <a href="https://fontawesome.com/search?o=r&s=solid" target="_blank" rel="noreferrer" className="underline">fontawesome.com</a> (estilo &quot;solid&quot;), sem o prefixo &quot;fa-solid&quot;.
							</p>
						</div>
						<button type="submit" className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Guardar</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
