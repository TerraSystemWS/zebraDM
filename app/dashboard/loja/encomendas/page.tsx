"use client";

import { useEffect, useMemo, useState } from "react";
import { Order, ordersService } from "@/services/ordersService";
import Swal from "sweetalert2";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
	PENDING_PAYMENT: "Pendente",
	AWAITING_TRANSFER: "Aguarda Transferência",
	AWAITING_CASH: "Aguarda Pagamento",
	PAID: "Paga",
	FAILED: "Falhou",
	CANCELLED: "Cancelada",
};

const FULFILLMENT_LABELS: Record<Order["fulfillmentStatus"], string> = {
	PENDING_SHIPMENT: "Por enviar",
	SHIPPED: "Enviada",
	DELIVERED: "Entregue",
};

const FULFILLMENT_CLASS: Record<Order["fulfillmentStatus"], string> = {
	PENDING_SHIPMENT: "bg-yellow-200 text-yellow-900",
	SHIPPED: "bg-blue-200 text-blue-900",
	DELIVERED: "bg-green-200 text-green-900",
};

// Só os estados "em curso" aparecem no filtro da lista principal — encomendas
// entregues saem dela por completo (ver secção "Concluídas" mais abaixo).
const ACTIVE_FULFILLMENT_LABELS: Record<string, string> = {
	PENDING_SHIPMENT: "Por enviar",
	SHIPPED: "Enviada",
};

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [fulfillmentFilter, setFulfillmentFilter] = useState("");
	const [showDelivered, setShowDelivered] = useState(false);

	useEffect(() => {
		load();
	}, []);

	const load = async () => {
		setLoading(true);
		try {
			setOrders(await ordersService.getAll());
		} catch (error) {
			console.error("Error loading orders:", error);
			Swal.fire("Erro", "Erro ao carregar encomendas", "error");
		} finally {
			setLoading(false);
		}
	};

	const matchesQuery = (o: Order, q: string) =>
		!q || o.userName.toLowerCase().includes(q) || (o.userEmail ?? "").toLowerCase().includes(q);

	// Encomendas entregues já não têm relação com o fluxo de trabalho atual —
	// saem da lista principal e só aparecem numa secção à parte, escondida por
	// padrão (mesmo padrão das "Reservas Concluídas" do Hotel).
	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return orders.filter((o) => {
			if (o.fulfillmentStatus === "DELIVERED") return false;
			if (!matchesQuery(o, q)) return false;
			if (fulfillmentFilter && o.fulfillmentStatus !== fulfillmentFilter) return false;
			return true;
		});
	}, [orders, query, fulfillmentFilter]);

	const deliveredOrders = useMemo(() => {
		const q = query.trim().toLowerCase();
		return orders.filter((o) => o.fulfillmentStatus === "DELIVERED" && matchesQuery(o, q));
	}, [orders, query]);

	const handleChangeFulfillment = async (order: Order) => {
		const { value: fulfillmentStatus } = await Swal.fire({
			title: "Estado de envio",
			input: "select",
			inputOptions: {
				PENDING_SHIPMENT: "Por enviar",
				SHIPPED: "Enviada",
				DELIVERED: "Entregue",
			},
			inputValue: order.fulfillmentStatus,
			showCancelButton: true,
			confirmButtonText: "Guardar",
			cancelButtonText: "Cancelar",
		});
		if (!fulfillmentStatus) return;
		try {
			await ordersService.updateFulfillmentStatus(order.id, fulfillmentStatus as Order["fulfillmentStatus"]);
			await load();
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível atualizar", "error");
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando encomendas...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Encomendas</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Produtos comprados na loja — trata aqui o envio/entrega de cada encomenda.
					</p>
				</div>
			</div>

			<div className="mb-4 grid gap-3 sm:grid-cols-2">
				<input
					className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					placeholder="Pesquisar por cliente ou email..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				<select
					className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					value={fulfillmentFilter}
					onChange={(e) => setFulfillmentFilter(e.target.value)}
				>
					<option value="">Todos os estados de envio</option>
					{Object.entries(ACTIVE_FULFILLMENT_LABELS).map(([value, label]) => (
						<option key={value} value={value}>{label}</option>
					))}
				</select>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							{["ID", "Cliente", "Itens", "Valor", "Pagamento", "Envio", "Data"].map((h) => (
								<th key={h} className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{filtered.map((order) => (
							<tr key={order.id}>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">#{order.id}</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									<div>{order.userName}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">{order.userEmail ?? "—"}</div>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{order.items.map((item, idx) => (
										<div key={idx}>{item.quantity}× {item.name}</div>
									))}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">${order.totalAmount}</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{PAYMENT_STATUS_LABELS[order.status] ?? order.status}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
									<button
										onClick={() => handleChangeFulfillment(order)}
										className={`rounded-full px-3 py-1 text-xs font-semibold ${FULFILLMENT_CLASS[order.fulfillmentStatus]}`}
									>
										{FULFILLMENT_LABELS[order.fulfillmentStatus]}
									</button>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{new Date(order.createdAt).toLocaleDateString()}
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td colSpan={7} className="px-5 py-6 text-center text-sm text-gray-500 dark:bg-gray-800">Sem encomendas.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<div className="mt-6">
				<button
					className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
					onClick={() => setShowDelivered((v) => !v)}
				>
					{showDelivered ? "Ocultar" : "Mostrar"} encomendas entregues ({deliveredOrders.length})
				</button>
			</div>

			{showDelivered && (
				<div className="mt-4 overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
					<div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300">
						Encomendas Entregues
					</div>
					<table className="min-w-full leading-normal">
						<thead>
							<tr>
								{["ID", "Cliente", "Itens", "Valor", "Pagamento", "Data"].map((h) => (
									<th key={h} className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{deliveredOrders.map((order) => (
								<tr key={order.id}>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">#{order.id}</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										<div>{order.userName}</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">{order.userEmail ?? "—"}</div>
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										{order.items.map((item, idx) => (
											<div key={idx}>{item.quantity}× {item.name}</div>
										))}
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">${order.totalAmount}</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										{PAYMENT_STATUS_LABELS[order.status] ?? order.status}
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										{new Date(order.createdAt).toLocaleDateString()}
									</td>
								</tr>
							))}
							{deliveredOrders.length === 0 && (
								<tr>
									<td colSpan={6} className="px-5 py-6 text-center text-sm text-gray-500 dark:bg-gray-800">Sem encomendas entregues.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
