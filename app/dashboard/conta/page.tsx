"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getMe, updateMe } from "@/lib/auth";

export default function MinhaContaPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	useEffect(() => {
		getMe()
			.then((me) => {
				setFullName(me.fullName);
				setEmail(me.email);
				setPhone(me.phone ?? "");
			})
			.catch(() => Swal.fire("Erro", "Não foi possível carregar os teus dados", "error"))
			.finally(() => setLoading(false));
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentPassword) {
			Swal.fire("Erro", "Introduz a tua password atual para confirmar as alterações", "error");
			return;
		}
		if (newPassword && newPassword !== confirmPassword) {
			Swal.fire("Erro", "A confirmação da nova password não coincide", "error");
			return;
		}
		setSaving(true);
		try {
			await updateMe({
				fullName,
				email,
				phone: phone || null,
				currentPassword,
				newPassword: newPassword || undefined,
			});
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			Swal.fire("Sucesso", "Dados atualizados.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar as alterações", "error");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando...</div>;
	}

	return (
		<div className="container mx-auto max-w-lg p-6">
			<h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">Minha Conta</h1>

			<form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<div>
					<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome</label>
					<input
						required
						className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
					/>
				</div>
				<div>
					<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
					<input
						required
						type="email"
						className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</div>
				<div>
					<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Telefone (opcional)</label>
					<input
						className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
					/>
				</div>

				<hr className="border-gray-200 dark:border-gray-700" />

				<div>
					<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nova password (opcional)</label>
					<input
						type="password"
						minLength={6}
						className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						placeholder="Deixa em branco para não alterar"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
					/>
				</div>
				{newPassword && (
					<div>
						<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Confirmar nova password</label>
						<input
							type="password"
							className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</div>
				)}

				<div>
					<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
						Password atual <span className="font-normal text-gray-500">(obrigatória para confirmar qualquer alteração)</span>
					</label>
					<input
						required
						type="password"
						className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
					/>
				</div>

				<button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
					{saving ? "A guardar..." : "Guardar Alterações"}
				</button>
			</form>
		</div>
	);
}
