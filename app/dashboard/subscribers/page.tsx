"use client";

import { useEffect, useState } from "react";
import { Subscriber, subscribersService } from "@/services/subscribersService";
import Swal from "sweetalert2";

export default function SubscribersPage() {
	const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadSubscribers();
	}, []);

	const loadSubscribers = async () => {
		setLoading(true);
		try {
			const data = await subscribersService.getAll();
			setSubscribers(data);
		} catch (error) {
			console.error("Error loading subscribers:", error);
			Swal.fire("Erro", "Erro ao carregar subscritores", "error");
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
				await subscribersService.delete(id);
				setSubscribers(subscribers.filter((s) => s.id !== id));
				Swal.fire("Apagado!", "O subscritor foi removido.", "success");
			} catch (error) {
				console.error("Error deleting subscriber:", error);
				Swal.fire("Erro", "Erro ao apagar subscritor", "error");
			}
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando subscritores...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Subscritores</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Todos os clientes registados e quem subscreveu a newsletter no site público.
					</p>
				</div>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Email
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Data de Subscrição
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Conectividade
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								*
							</th>
						</tr>
					</thead>
					<tbody>
						{subscribers.length === 0 && (
							<tr>
								<td colSpan={4} className="border-b border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
									Ainda não há subscritores.
								</td>
							</tr>
						)}
						{subscribers.map((subscriber) => (
							<tr key={subscriber.id}>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<p className="whitespace-no-wrap text-gray-900 dark:text-white">{subscriber.email}</p>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<p className="whitespace-no-wrap text-gray-900 dark:text-white">
										{new Date(subscriber.subscribedAt).toLocaleDateString("pt-PT")}
									</p>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<span className="relative inline-block px-3 py-1 font-semibold leading-tight text-gray-600 dark:text-gray-300">
										<span aria-hidden className="absolute inset-0 rounded-full bg-gray-200 opacity-50 dark:bg-gray-600"></span>
										<span className="relative">Não verificado</span>
									</span>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<button
										className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
										onClick={() => handleDelete(subscriber.id)}
									>
										Apagar
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
