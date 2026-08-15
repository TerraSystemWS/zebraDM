"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { getUser } from "@/lib/api";
import { invoicesService, InvoiceCompanyProfile } from "@/services/invoicesService";

const emptyProfile: InvoiceCompanyProfile = { name: "", legalName: "", nif: "", address: "", email: "", logoUrl: null };

export default function InvoiceSettingsPage() {
	const isAdmin = getUser()?.role === "ADMIN";
	const [profile, setProfile] = useState<InvoiceCompanyProfile>(emptyProfile);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		load();
	}, []);

	const load = async () => {
		setLoading(true);
		try {
			setProfile(await invoicesService.getCompanyProfile());
		} catch (error) {
			console.error("Error loading invoice company profile:", error);
			Swal.fire("Erro", "Não foi possível carregar os dados da empresa", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (field: keyof InvoiceCompanyProfile, value: string) => {
		setProfile((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		if (!profile.name.trim()) {
			Swal.fire("Erro", "O nome da empresa é obrigatório", "error");
			return;
		}
		if (!profile.nif.trim()) {
			Swal.fire("Erro", "O NIF da empresa é obrigatório", "error");
			return;
		}
		setSaving(true);
		try {
			const updated = await invoicesService.updateCompanyProfile({
				name: profile.name.trim(),
				legalName: profile.legalName,
				nif: profile.nif.trim(),
				address: profile.address,
				email: profile.email,
			});
			setProfile(updated);
			Swal.fire("Sucesso", "Dados da empresa atualizados — as próximas faturas já usam estes dados", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingLogo(true);
		try {
			const updated = await invoicesService.uploadLogo(file);
			setProfile(updated);
			Swal.fire("Sucesso", "Logótipo atualizado", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível enviar o logótipo", "error");
		} finally {
			setUploadingLogo(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuração de Faturação</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Dados fiscais e logótipo da empresa impressos no cabeçalho de todas as faturas.
				</p>
			</div>

			{!isAdmin && (
				<div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
					Só um Administrador pode alterar estes dados. Podes consultá-los, mas não editá-los.
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 lg:col-span-2">
					<h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Dados da Empresa</h2>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Empresa</label>
							<input
								className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={profile.name}
								disabled={!isAdmin}
								onChange={(e) => handleChange("name", e.target.value)}
								placeholder="ZebraTravel"
							/>
						</div>
						<div className="sm:col-span-2">
							<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Fiscal / Razão Social (opcional)</label>
							<input
								className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={profile.legalName}
								disabled={!isAdmin}
								onChange={(e) => handleChange("legalName", e.target.value)}
								placeholder="Só se for diferente do nome acima"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">NIF</label>
							<input
								className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={profile.nif}
								disabled={!isAdmin}
								onChange={(e) => handleChange("nif", e.target.value)}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
							<input
								className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								type="email"
								value={profile.email}
								disabled={!isAdmin}
								onChange={(e) => handleChange("email", e.target.value)}
							/>
						</div>
						<div className="sm:col-span-2">
							<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Morada</label>
							<input
								className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={profile.address}
								disabled={!isAdmin}
								onChange={(e) => handleChange("address", e.target.value)}
							/>
						</div>
					</div>

					{isAdmin && (
						<button
							className="mt-6 rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
							type="button"
							disabled={saving}
							onClick={handleSave}
						>
							{saving ? "A guardar..." : "Guardar Dados"}
						</button>
					)}
				</div>

				<div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Logótipo</h2>
					<div className="mb-4 flex h-32 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
						{profile.logoUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={profile.logoUrl} alt="Logótipo da empresa" className="max-h-28 max-w-full object-contain" />
						) : (
							<span className="text-xs text-gray-400">Sem logótipo</span>
						)}
					</div>
					{isAdmin && (
						<>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg"
								className="hidden"
								onChange={handleLogoChange}
							/>
							<button
								className="w-full rounded bg-gray-700 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60"
								type="button"
								disabled={uploadingLogo}
								onClick={() => fileInputRef.current?.click()}
							>
								{uploadingLogo ? "A enviar..." : "Enviar Logótipo (PNG/JPEG)"}
							</button>
						</>
					)}
				</div>
			</div>

			<div className="mt-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Autenticidade das Faturas</h2>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Cada fatura é assinada digitalmente no momento da emissão (uma chave que só existe no servidor —
					nem um Administrador ou Agente consegue forjar uma fatura válida). O PDF mostra um código de
					verificação e um QR code no rodapé; qualquer pessoa pode confirmar a autenticidade do documento
					em <span className="font-mono">zebratravel.net/faturas/verificar</span>, sem precisar de sessão iniciada.
				</p>
			</div>
		</div>
	);
}
