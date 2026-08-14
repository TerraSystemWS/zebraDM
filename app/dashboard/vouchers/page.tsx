"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Voucher, VoucherInput, VoucherScope, vouchersService } from "@/services/vouchersService";
import { Excursao, excursoesService } from "@/services/excursoesService";
import { Produto, productsService } from "@/services/productsService";
import { Hotel, RoomType, hotelService } from "@/services/hotelService";
import Modal from "@/components/Modal";
import { getUser } from "@/lib/api";

const SCOPE_LABELS: Record<VoucherScope, string> = {
	ALL: "Tudo",
	EXCURSION: "Excursão",
	ROOM: "Quarto",
	PRODUCT: "Produto",
};

const emptyForm: VoucherInput = {
	code: "",
	requiresCode: true,
	discountPercent: 10,
	scope: "ALL",
	scopeItemId: null,
	validFrom: "",
	validUntil: "",
	maxUses: null,
	maxUsesPerUser: 1,
	active: true,
};

interface RoomTypeOption extends RoomType {
	hotelName: string;
}

export default function VouchersPage() {
	const [vouchers, setVouchers] = useState<Voucher[]>([]);
	const [excursoes, setExcursoes] = useState<Excursao[]>([]);
	const [produtos, setProdutos] = useState<Produto[]>([]);
	const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<Voucher | null>(null);
	const [form, setForm] = useState<VoucherInput>(emptyForm);
	const [saving, setSaving] = useState(false);
	const isAdmin = getUser()?.role === "ADMIN";

	const load = async () => {
		setLoading(true);
		try {
			const [vouchersData, excursoesData, produtosData, hotels] = await Promise.all([
				vouchersService.getAll(),
				excursoesService.getAll(),
				productsService.getAll(),
				hotelService.getHotels(),
			]);
			setVouchers(vouchersData);
			setExcursoes(excursoesData);
			setProdutos(produtosData);
			const roomTypeLists = await Promise.all(
				hotels.map(async (hotel: Hotel) => {
					const types = await hotelService.getRoomTypes(hotel.id);
					return types.map((rt: RoomType) => ({ ...rt, hotelName: hotel.name }));
				})
			);
			setRoomTypes(roomTypeLists.flat());
		} catch (error) {
			console.error("Error loading vouchers:", error);
			Swal.fire("Erro", "Erro ao carregar vouchers", "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setShowForm(true);
	};

	const openEdit = (voucher: Voucher) => {
		setEditing(voucher);
		setForm({
			code: voucher.code ?? "",
			requiresCode: voucher.requiresCode,
			discountPercent: voucher.discountPercent,
			scope: voucher.scope,
			scopeItemId: voucher.scopeItemId,
			validFrom: voucher.validFrom ?? "",
			validUntil: voucher.validUntil ?? "",
			maxUses: voucher.maxUses,
			maxUsesPerUser: voucher.maxUsesPerUser,
			active: voucher.active,
		});
		setShowForm(true);
	};

	const canManage = (voucher: Voucher) => isAdmin || voucher.createdById === getUser()?.id;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const payload: VoucherInput = {
				...form,
				code: form.requiresCode ? form.code : undefined,
				scopeItemId: form.scopeItemId || null,
				validFrom: form.validFrom || null,
				validUntil: form.validUntil || null,
			};
			if (editing) {
				await vouchersService.update(editing.id, payload);
			} else {
				await vouchersService.create(payload);
			}
			setShowForm(false);
			await load();
			Swal.fire("Sucesso", editing ? "Voucher atualizado." : "Voucher criado.", "success");
		} catch (error) {
			console.error("Error saving voucher:", error);
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar o voucher", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (voucher: Voucher) => {
		const result = await Swal.fire({
			title: `Apagar voucher "${voucher.code ?? "promoção #" + voucher.id}"?`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sim, apagar!",
		});
		if (!result.isConfirmed) return;
		try {
			await vouchersService.delete(voucher.id);
			await load();
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível apagar o voucher", "error");
		}
	};

	const handleShowRedemptions = async (voucher: Voucher) => {
		try {
			const redemptions = await vouchersService.getRedemptions(voucher.id);
			const html = redemptions.length === 0
				? "<p>Ainda não foi usado.</p>"
				: `<div style="text-align:left;max-height:300px;overflow-y:auto;">${redemptions
					.map(
						(r) =>
							`<div style="border-bottom:1px solid #eee;padding:6px 0;font-size:13px;">
								<strong>${r.userName}</strong> — ${r.appliedTo}<br/>
								-$${r.discountAmount.toFixed(2)} · ${new Date(r.redeemedAt).toLocaleString()}
								${r.released ? ' · <span style="color:#c00">libertado (cancelado)</span>' : ""}
							</div>`
					)
					.join("")}</div>`;
			Swal.fire({ title: "Histórico de uso", html, width: 500 });
		} catch {
			Swal.fire("Erro", "Não foi possível carregar o histórico", "error");
		}
	};

	const itemLabel = (voucher: Voucher) => {
		if (voucher.scopeItemId == null) return SCOPE_LABELS[voucher.scope] + " (qualquer)";
		if (voucher.scope === "EXCURSION") return excursoes.find((e) => e.id === voucher.scopeItemId)?.title ?? `Excursão #${voucher.scopeItemId}`;
		if (voucher.scope === "ROOM") {
			const rt = roomTypes.find((r) => r.id === voucher.scopeItemId);
			return rt ? `${rt.hotelName} — ${rt.name}` : `Quarto #${voucher.scopeItemId}`;
		}
		if (voucher.scope === "PRODUCT") return produtos.find((p) => p.id === voucher.scopeItemId)?.titulo ?? `Produto #${voucher.scopeItemId}`;
		return "—";
	};

	const statusLabel = (voucher: Voucher) => {
		if (!voucher.active) return { text: "Inativo", className: "bg-gray-200 text-gray-700" };
		const today = new Date().toISOString().slice(0, 10);
		if (voucher.validUntil && voucher.validUntil < today) return { text: "Expirado", className: "bg-red-200 text-red-900" };
		if (voucher.validFrom && voucher.validFrom > today) return { text: "Agendado", className: "bg-yellow-200 text-yellow-900" };
		if (voucher.maxUses != null && voucher.usesCount >= voucher.maxUses) return { text: "Esgotado", className: "bg-gray-200 text-gray-700" };
		return { text: "Ativo", className: "bg-green-200 text-green-900" };
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando vouchers...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Vouchers e Promoções</h1>
				<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={openCreate}>
					+ Criar
				</button>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							{["Código", "Desconto", "Âmbito", "Validade", "Usos", "Estado", "Ações"].map((h) => (
								<th
									key={h}
									className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{vouchers.map((voucher) => {
							const status = statusLabel(voucher);
							return (
								<tr key={voucher.id}>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										{voucher.requiresCode ? voucher.code : <span className="italic text-gray-400">Promoção fixa</span>}
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										{voucher.discountPercent}%
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										{itemLabel(voucher)}
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										{voucher.validFrom || "—"} → {voucher.validUntil || "—"}
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
										<button className="text-blue-600 hover:underline" onClick={() => handleShowRedemptions(voucher)}>
											{voucher.usesCount}{voucher.maxUses != null ? ` / ${voucher.maxUses}` : ""}
										</button>
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
										<span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.text}</span>
									</td>
									<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
										{canManage(voucher) && (
											<div className="flex flex-col items-start gap-1">
												<button className="text-blue-600 hover:text-blue-900" onClick={() => openEdit(voucher)}>Editar</button>
												<button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(voucher)}>Apagar</button>
											</div>
										)}
									</td>
								</tr>
							);
						})}
						{vouchers.length === 0 && (
							<tr>
								<td colSpan={7} className="px-5 py-6 text-center text-sm text-gray-500 dark:bg-gray-800">Sem vouchers.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{showForm && (
				<Modal title={editing ? "Editar Voucher" : "Criar Voucher"} onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Tipo</label>
							<select
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.requiresCode ? "CODE" : "PROMO"}
								onChange={(e) => {
									const requiresCode = e.target.value === "CODE";
									setForm({ ...form, requiresCode, scope: requiresCode ? form.scope : "PRODUCT" });
								}}
							>
								<option value="CODE">Voucher com código (excursões, quartos ou produtos)</option>
								<option value="PROMO">Promoção fixa sem código (só um produto específico)</option>
							</select>
						</div>

						{form.requiresCode && (
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Código</label>
								<input
									required
									className="w-full rounded border px-3 py-2 uppercase dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									placeholder="ex: VERAO20"
									value={form.code}
									onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
								/>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Desconto (%)</label>
								<input
									type="number"
									min={0}
									max={99}
									required
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.discountPercent}
									onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Âmbito</label>
								<select
									disabled={!form.requiresCode}
									className="w-full rounded border px-3 py-2 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.scope}
									onChange={(e) => setForm({ ...form, scope: e.target.value as VoucherScope, scopeItemId: null })}
								>
									{form.requiresCode && <option value="ALL">Tudo</option>}
									{form.requiresCode && <option value="EXCURSION">Excursão</option>}
									{form.requiresCode && <option value="ROOM">Quarto</option>}
									<option value="PRODUCT">Produto</option>
								</select>
							</div>
						</div>

						{form.scope === "EXCURSION" && (
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Excursão (opcional — vazio = qualquer)</label>
								<select
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.scopeItemId ?? ""}
									onChange={(e) => setForm({ ...form, scopeItemId: e.target.value ? Number(e.target.value) : null })}
								>
									<option value="">Qualquer excursão</option>
									{excursoes.map((ex) => (
										<option key={ex.id} value={ex.id}>{ex.title}</option>
									))}
								</select>
							</div>
						)}

						{form.scope === "ROOM" && (
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Tipo de Quarto (opcional — vazio = qualquer)</label>
								<select
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.scopeItemId ?? ""}
									onChange={(e) => setForm({ ...form, scopeItemId: e.target.value ? Number(e.target.value) : null })}
								>
									<option value="">Qualquer quarto</option>
									{roomTypes.map((rt) => (
										<option key={rt.id} value={rt.id}>{rt.hotelName} — {rt.name}</option>
									))}
								</select>
							</div>
						)}

						{form.scope === "PRODUCT" && (
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
									Produto {form.requiresCode ? "(opcional — vazio = qualquer)" : ""}
								</label>
								<select
									required={!form.requiresCode}
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.scopeItemId ?? ""}
									onChange={(e) => setForm({ ...form, scopeItemId: e.target.value ? Number(e.target.value) : null })}
								>
									<option value="">{form.requiresCode ? "Qualquer produto" : "Escolhe um produto"}</option>
									{produtos.map((p) => (
										<option key={p.id} value={p.id}>{p.titulo}</option>
									))}
								</select>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Válido de (opcional)</label>
								<input
									type="date"
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.validFrom ?? ""}
									onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Válido até (opcional)</label>
								<input
									type="date"
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.validUntil ?? ""}
									onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Limite total de usos (vazio = sem limite)</label>
								<input
									type="number"
									min={1}
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.maxUses ?? ""}
									onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : null })}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Limite por cliente (vazio = sem limite)</label>
								<input
									type="number"
									min={1}
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.maxUsesPerUser ?? ""}
									onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value ? Number(e.target.value) : null })}
								/>
							</div>
						</div>

						<label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
							<input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
							Ativo
						</label>

						<button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
							{saving ? "A guardar..." : editing ? "Guardar Alterações" : "Criar Voucher"}
						</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
