"use client";

import { useEffect, useMemo, useState } from "react";
import { CounterSaleItemInput, Order, ordersService } from "@/services/ordersService";
import { Produto, productsService } from "@/services/productsService";
import Modal from "@/components/Modal";
import Swal from "sweetalert2";

const AWAITING_MANUAL_PAYMENT = new Set(["AWAITING_TRANSFER", "AWAITING_CASH"]);

function parsePreco(preco: string): number {
	return parseFloat(preco.replace("€", "").replace(",", ".")) || 0;
}

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

	const [produtos, setProdutos] = useState<Produto[]>([]);
	const [showCounterSale, setShowCounterSale] = useState(false);
	const [cartItems, setCartItems] = useState<CounterSaleItemInput[]>([]);
	const [selectedProductId, setSelectedProductId] = useState<number | "">("");
	const [selectedQty, setSelectedQty] = useState(1);
	const [guestName, setGuestName] = useState("");
	const [guestEmail, setGuestEmail] = useState("");
	const [customerNif, setCustomerNif] = useState("");
	const [saleMethod, setSaleMethod] = useState<"CASH" | "TRANSFER">("CASH");
	const [voucherCode, setVoucherCode] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		load();
	}, []);

	const load = async () => {
		setLoading(true);
		try {
			const [ordersData, produtosData] = await Promise.all([ordersService.getAll(), productsService.getAll()]);
			setOrders(ordersData);
			setProdutos(produtosData);
		} catch (error) {
			console.error("Error loading orders:", error);
			Swal.fire("Erro", "Erro ao carregar encomendas", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleMarkPaid = async (order: Order) => {
		const result = await Swal.fire({
			title: `Marcar a encomenda #${order.id} como paga?`,
			text: "Isto emite a fatura para esta encomenda.",
			icon: "question",
			showCancelButton: true,
			confirmButtonText: "Sim, foi paga",
		});
		if (!result.isConfirmed) return;
		try {
			await ordersService.markPaid(order.id);
			await load();
			Swal.fire("Sucesso", "Encomenda marcada como paga e fatura emitida.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível marcar como paga", "error");
		}
	};

	const openCounterSale = () => {
		setCartItems([]);
		setSelectedProductId("");
		setSelectedQty(1);
		setGuestName("");
		setGuestEmail("");
		setCustomerNif("");
		setSaleMethod("CASH");
		setVoucherCode("");
		setShowCounterSale(true);
	};

	const addToCart = () => {
		if (!selectedProductId) return;
		const produto = produtos.find((p) => p.id === selectedProductId);
		if (!produto) return;
		setCartItems((prev) => [
			...prev,
			{ productId: produto.id, name: produto.titulo, price: parsePreco(produto.preco), quantity: selectedQty },
		]);
		setSelectedProductId("");
		setSelectedQty(1);
	};

	const removeFromCart = (index: number) => {
		setCartItems((prev) => prev.filter((_, i) => i !== index));
	};

	const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

	const handleCounterSaleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (cartItems.length === 0) {
			Swal.fire("Erro", "Adiciona pelo menos um produto", "error");
			return;
		}
		if (!guestName.trim()) {
			Swal.fire("Erro", "O nome do cliente é obrigatório", "error");
			return;
		}
		setSaving(true);
		try {
			await ordersService.counterSale({
				items: cartItems,
				paymentMethod: saleMethod,
				guestName: guestName.trim(),
				guestEmail: guestEmail.trim() || undefined,
				customerNif: customerNif.trim() || undefined,
				voucherCode: voucherCode.trim() || undefined,
			});
			setShowCounterSale(false);
			await load();
			Swal.fire("Sucesso", "Venda ao balcão criada. Marca como paga quando o pagamento for recebido.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível criar a venda", "error");
		} finally {
			setSaving(false);
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
				<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={openCounterSale}>
					+ Vender no Balcão
				</button>
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
							{["ID", "Cliente", "Itens", "Valor", "Pagamento", "Envio", "Data", "Ações"].map((h) => (
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
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
									{AWAITING_MANUAL_PAYMENT.has(order.status) && (
										<button className="text-blue-600 hover:underline" onClick={() => handleMarkPaid(order)}>
											Marcar como Paga
										</button>
									)}
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td colSpan={8} className="px-5 py-6 text-center text-sm text-gray-500 dark:bg-gray-800">Sem encomendas.</td>
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

			{showCounterSale && (
				<Modal title="Vender no Balcão" onClose={() => setShowCounterSale(false)}>
					<form onSubmit={handleCounterSaleSubmit} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Adicionar produto</label>
							<div className="flex gap-2">
								<select
									className="flex-1 rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={selectedProductId}
									onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
								>
									<option value="">Escolhe um produto</option>
									{produtos.map((p) => (
										<option key={p.id} value={p.id}>{p.titulo} — {p.preco}</option>
									))}
								</select>
								<input
									type="number"
									min={1}
									className="w-20 rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={selectedQty}
									onChange={(e) => setSelectedQty(Number(e.target.value))}
								/>
								<button type="button" className="rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700" onClick={addToCart}>
									Adicionar
								</button>
							</div>
						</div>

						{cartItems.length > 0 && (
							<div className="rounded border border-gray-200 dark:border-gray-600">
								{cartItems.map((item, idx) => (
									<div key={idx} className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-sm last:border-0 dark:border-gray-700 dark:text-white">
										<span>{item.quantity}× {item.name} — ${(item.price * item.quantity).toFixed(2)}</span>
										<button type="button" className="text-red-600 hover:underline" onClick={() => removeFromCart(idx)}>Remover</button>
									</div>
								))}
								<div className="px-3 py-2 text-right text-sm font-bold dark:text-white">Total: ${cartTotal.toFixed(2)}</div>
							</div>
						)}

						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome do Cliente</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={guestName}
								onChange={(e) => setGuestName(e.target.value)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Email (opcional)</label>
								<input
									type="email"
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={guestEmail}
									onChange={(e) => setGuestEmail(e.target.value)}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">NIF (opcional)</label>
								<input
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={customerNif}
									onChange={(e) => setCustomerNif(e.target.value)}
								/>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Código de voucher (opcional)</label>
							<input
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={voucherCode}
								onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Método de Pagamento</label>
							<select
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={saleMethod}
								onChange={(e) => setSaleMethod(e.target.value as "CASH" | "TRANSFER")}
							>
								<option value="CASH">Dinheiro</option>
								<option value="TRANSFER">Transferência</option>
							</select>
						</div>

						<button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
							{saving ? "A criar..." : "Criar Venda"}
						</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
