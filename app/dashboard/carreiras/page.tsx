"use client";

import { useEffect, useState } from "react";
import { JobApplication, jobApplicationsService } from "@/services/jobApplicationsService";
import Modal from "@/components/Modal";
import Swal from "sweetalert2";

export default function CarreirasPage() {
	const [applications, setApplications] = useState<JobApplication[]>([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<JobApplication | null>(null);

	useEffect(() => {
		loadApplications();
	}, []);

	const loadApplications = async () => {
		setLoading(true);
		try {
			const data = await jobApplicationsService.getAll();
			setApplications(data);
		} catch (error) {
			console.error("Error loading job applications:", error);
			Swal.fire("Erro", "Erro ao carregar candidaturas", "error");
		} finally {
			setLoading(false);
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
				await jobApplicationsService.delete(id);
				setApplications(applications.filter((a) => a.id !== id));
				setSelected(null);
				Swal.fire("Apagada!", "A candidatura foi removida.", "success");
			} catch (error) {
				console.error("Error deleting job application:", error);
				Swal.fire("Erro", "Erro ao apagar candidatura", "error");
			}
		}
	};

	const handleOpenCv = async (app: JobApplication) => {
		try {
			await jobApplicationsService.openCv(app.id);
		} catch (error) {
			console.error("Error opening CV:", error);
			Swal.fire("Erro", "Não foi possível abrir o CV", "error");
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando candidaturas...</div>;
	}

	const groups = applications.reduce<Record<string, JobApplication[]>>((acc, app) => {
		(acc[app.area] ??= []).push(app);
		return acc;
	}, {});

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Carreiras (Trabalhe Connosco)</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Candidaturas submetidas na página pública "Trabalhe Connosco", agrupadas por área.
				</p>
			</div>

			{applications.length === 0 ? (
				<div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
					Ainda não há candidaturas.
				</div>
			) : (
				<div className="grid gap-6">
					{Object.entries(groups).map(([area, apps]) => (
						<div key={area} className="rounded-lg bg-white shadow dark:bg-gray-800">
							<div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
								<h2 className="font-semibold text-gray-800 dark:text-white">
									{area} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({apps.length})</span>
								</h2>
							</div>
							<div className="divide-y divide-gray-100 dark:divide-gray-700">
								{apps.map((app) => (
									<button
										key={app.id}
										className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
										onClick={() => setSelected(app)}
									>
										<div>
											<p className="font-medium text-gray-900 dark:text-white">{app.name}</p>
											<p className="text-sm text-gray-500 dark:text-gray-400">{app.phone}</p>
										</div>
										<span className="text-xs text-gray-400">
											{new Date(app.createdAt).toLocaleDateString("pt-PT")}
										</span>
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			{selected && (
				<Modal title={selected.name} onClose={() => setSelected(null)}>
					<div className="grid gap-3">
						<div>
							<p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Área</p>
							<p className="text-gray-900 dark:text-white">{selected.area}</p>
						</div>
						<div>
							<p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Telefone</p>
							<p className="text-gray-900 dark:text-white">{selected.phone}</p>
						</div>
						<div>
							<p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Email</p>
							<p className="text-gray-900 dark:text-white">{selected.email}</p>
						</div>
						<div>
							<p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Descrição</p>
							<p className="whitespace-pre-wrap text-gray-900 dark:text-white">{selected.description}</p>
						</div>
						<div>
							<p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Data</p>
							<p className="text-gray-900 dark:text-white">
								{new Date(selected.createdAt).toLocaleString("pt-PT")}
							</p>
						</div>
						<div className="mt-2 flex flex-wrap gap-3">
							<button
								className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
								onClick={() => handleOpenCv(selected)}
							>
								Ver CV ({selected.cvOriginalFilename})
							</button>
							<button
								className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
								onClick={() => handleDelete(selected.id)}
							>
								Apagar
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
}
