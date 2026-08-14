"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ContactMessage, contactsService } from "@/services/contactsService";
import { getUser } from "@/lib/api";

function formatDate(iso: string): string {
	return new Date(iso).toLocaleString();
}

export default function ContactsPage() {
	const [messages, setMessages] = useState<ContactMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const isAdmin = getUser()?.role === "ADMIN";

	const load = async () => {
		setLoading(true);
		try {
			const data = await contactsService.getAll();
			setMessages(data);
			if (selectedId == null && data.length > 0) setSelectedId(data[0].id);
		} catch (error) {
			console.error("Error loading contact messages:", error);
			Swal.fire("Erro", "Erro ao carregar mensagens", "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const selected = messages.find((m) => m.id === selectedId) ?? null;

	const openMessage = async (message: ContactMessage) => {
		setSelectedId(message.id);
		if (!message.read) {
			try {
				const updated = await contactsService.markRead(message.id);
				setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
			} catch (error) {
				console.error("Error marking message as read:", error);
			}
		}
	};

	const handleDelete = async (message: ContactMessage) => {
		const result = await Swal.fire({
			title: `Apagar mensagem de "${message.name}"?`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sim, apagar!",
			cancelButtonText: "Cancelar",
		});
		if (!result.isConfirmed) return;
		try {
			await contactsService.delete(message.id);
			setMessages((prev) => prev.filter((m) => m.id !== message.id));
			if (selectedId === message.id) setSelectedId(null);
		} catch (error) {
			console.error("Error deleting message:", error);
			Swal.fire("Erro", "Não foi possível apagar a mensagem", "error");
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando mensagens...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">Mensagens de Contacto</h1>

			<div className="grid gap-4 lg:grid-cols-[360px_1fr]">
				<div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
					{messages.length === 0 && (
						<div className="p-6 text-sm text-gray-500 dark:text-gray-400">Ainda não há mensagens de contacto.</div>
					)}
					<ul className="divide-y divide-gray-100 dark:divide-gray-700">
						{messages.map((message) => (
							<li key={message.id}>
								<button
									onClick={() => openMessage(message)}
									className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
										selectedId === message.id ? "bg-blue-50 dark:bg-blue-900/30" : ""
									}`}
								>
									<div className="flex items-center justify-between gap-2">
										<span className={`truncate text-sm ${message.read ? "font-normal text-gray-700 dark:text-gray-300" : "font-bold text-gray-900 dark:text-white"}`}>
											{message.name}
										</span>
										{!message.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />}
									</div>
									<div className={`truncate text-sm ${message.read ? "text-gray-500 dark:text-gray-400" : "font-semibold text-gray-800 dark:text-gray-200"}`}>
										{message.subject || "(sem assunto)"}
									</div>
									<div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatDate(message.createdAt)}</div>
								</button>
							</li>
						))}
					</ul>
				</div>

				<div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					{!selected ? (
						<p className="text-sm text-gray-500 dark:text-gray-400">Seleciona uma mensagem para ler.</p>
					) : (
						<div>
							<div className="mb-4 flex items-start justify-between gap-3">
								<div>
									<h2 className="text-lg font-bold text-gray-800 dark:text-white">{selected.subject || "(sem assunto)"}</h2>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										{selected.name} &lt;{selected.email}&gt;{selected.phone && ` · ${selected.phone}`}
									</p>
									<p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(selected.createdAt)}</p>
								</div>
								{isAdmin && (
									<button
										onClick={() => handleDelete(selected)}
										className="flex-shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
									>
										Apagar
									</button>
								)}
							</div>
							<p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{selected.message}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
