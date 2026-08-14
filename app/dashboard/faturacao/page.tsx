"use client";

import { useEffect, useMemo, useState } from "react";
import { Invoice, invoicesService } from "@/services/invoicesService";
import Swal from "sweetalert2";

const SOURCE_LABELS: Record<Invoice["sourceType"], string> = {
	ORDER: "Loja",
	EXCURSION_BOOKING: "Excursão",
	HOTEL_RESERVATION: "Hotel",
};

export default function FaturacaoPage() {
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [sourceFilter, setSourceFilter] = useState("");

	useEffect(() => {
		load();
	}, []);

	const load = async () => {
		setLoading(true);
		try {
			setInvoices(await invoicesService.getAll());
		} catch (error) {
			console.error("Error loading invoices:", error);
			Swal.fire("Erro", "Erro ao carregar faturas", "error");
		} finally {
			setLoading(false);
		}
	};

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return invoices.filter((inv) => {
			if (sourceFilter && inv.sourceType !== sourceFilter) return false;
			if (!q) return true;
			return (
				inv.documentNumber.toLowerCase().includes(q) ||
				inv.customerName.toLowerCase().includes(q) ||
				(inv.customerNif ?? "").toLowerCase().includes(q)
			);
		});
	}, [invoices, query, sourceFilter]);

	const handleOpenPdf = async (invoice: Invoice) => {
		try {
			await invoicesService.openPdf(invoice.id);
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível abrir a fatura", "error");
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando faturas...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Faturação</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Faturas-recibo emitidas automaticamente quando um pagamento é confirmado (Loja, Excursões, Hotel).
				</p>
			</div>

			<div className="mb-4 grid gap-3 sm:grid-cols-2">
				<input
					className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					placeholder="Pesquisar por número, cliente ou NIF..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				<select
					className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					value={sourceFilter}
					onChange={(e) => setSourceFilter(e.target.value)}
				>
					<option value="">Todas as origens</option>
					{Object.entries(SOURCE_LABELS).map(([value, label]) => (
						<option key={value} value={value}>{label}</option>
					))}
				</select>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							{["Nº", "Origem", "Cliente", "NIF", "Total", "Data", "Ações"].map((h) => (
								<th key={h} className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{filtered.map((invoice) => (
							<tr key={invoice.id}>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm font-mono dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{invoice.documentNumber}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{SOURCE_LABELS[invoice.sourceType]}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									<div>{invoice.customerName}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">{invoice.customerEmail ?? "—"}</div>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{invoice.customerNif ?? <span className="italic text-gray-400">Consumidor Final</span>}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{invoice.totalAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} {invoice.currency}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{new Date(invoice.createdAt).toLocaleDateString()}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
									<button className="text-blue-600 hover:underline" onClick={() => handleOpenPdf(invoice)}>
										Ver PDF
									</button>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td colSpan={7} className="px-5 py-6 text-center text-sm text-gray-500 dark:bg-gray-800">Sem faturas.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
