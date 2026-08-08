"use client";

import { useEffect, useState } from "react";
import { TeamMember, TeamMemberInput, teamMembersService } from "@/services/teamMembersService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import Swal from "sweetalert2";

const emptyForm: TeamMemberInput = { name: "", designation: "", image: "" };

export default function EquipaPage() {
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState<TeamMember | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<TeamMemberInput>(emptyForm);

	useEffect(() => {
		loadMembers();
	}, []);

	const loadMembers = async () => {
		setLoading(true);
		try {
			const data = await teamMembersService.getAll();
			setMembers(data);
		} catch (error) {
			console.error("Error loading team members:", error);
			Swal.fire("Erro", "Erro ao carregar a equipa", "error");
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setShowForm(true);
	};

	const openEdit = (member: TeamMember) => {
		setEditing(member);
		setForm({ name: member.name, designation: member.designation, image: member.image });
		setShowForm(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			if (editing) {
				await teamMembersService.update(editing.id, form);
			} else {
				await teamMembersService.create(form);
			}
			setShowForm(false);
			await loadMembers();
			Swal.fire("Sucesso", editing ? "Membro atualizado." : "Membro adicionado.", "success");
		} catch (error) {
			console.error("Error saving team member:", error);
			Swal.fire("Erro", "Não foi possível guardar o membro", "error");
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
				await teamMembersService.delete(id);
				setMembers(members.filter((m) => m.id !== id));
				Swal.fire("Apagado!", "O membro foi removido.", "success");
			} catch (error) {
				console.error("Error deleting team member:", error);
				Swal.fire("Erro", "Erro ao apagar o membro", "error");
			}
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando equipa...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Equipa / Guias Turísticos</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Mostrados na secção "Equipa" do site público.
					</p>
				</div>
				<button
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					onClick={openCreate}
				>
					+ Adicionar Membro
				</button>
			</div>

			{members.length === 0 ? (
				<div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
					Ainda não há membros na equipa.
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{members.map((member) => (
						<div key={member.id} className="rounded-lg bg-white shadow dark:bg-gray-800">
							<div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
								<img src={member.image} alt="" className="h-full w-full object-cover" />
							</div>
							<div className="p-3">
								<p className="truncate font-medium text-gray-900 dark:text-white">{member.name}</p>
								<p className="truncate text-sm text-gray-500 dark:text-gray-400">{member.designation}</p>
								<div className="mt-2 flex gap-3 text-sm">
									<button
										className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
										onClick={() => openEdit(member)}
									>
										Editar
									</button>
									<button
										className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
										onClick={() => handleDelete(member.id)}
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
				<Modal title={editing ? "Editar Membro" : "Novo Membro"} onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
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
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Cargo</label>
							<input
								required
								placeholder="ex: Tour Guide"
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.designation}
								onChange={(e) => setForm({ ...form, designation: e.target.value })}
							/>
						</div>
						<ImagePicker
							label="Foto"
							value={form.image}
							onChange={(url) => setForm({ ...form, image: url })}
						/>
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
