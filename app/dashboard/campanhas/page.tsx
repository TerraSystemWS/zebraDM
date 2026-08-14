"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Campaign, CampaignInput, CampaignPlacement, campaignsService } from "@/services/campaignsService";
import { Excursao, excursoesService } from "@/services/excursoesService";
import { Produto, productsService } from "@/services/productsService";
import { Hotel, RoomType, hotelService } from "@/services/hotelService";
import { Voucher, vouchersService } from "@/services/vouchersService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import { getUser } from "@/lib/api";

const PLACEMENT_LABELS: Record<CampaignPlacement, string> = {
	HOME_HERO: "Home — Destaque principal",
	HOME_STRIP: "Home — Faixa secundária",
	LOJA_TOP: "Loja — Topo",
	EXCURSOES_TOP: "Excursões — Topo",
	HOTEL_TOP: "Hotel — Topo",
};

const PLACEMENT_DIMENSIONS: Record<CampaignPlacement, { width: number; height: number }> = {
	HOME_HERO: { width: 1920, height: 600 },
	HOME_STRIP: { width: 1200, height: 300 },
	LOJA_TOP: { width: 1600, height: 400 },
	EXCURSOES_TOP: { width: 1600, height: 400 },
	HOTEL_TOP: { width: 1600, height: 400 },
};

type TargetType = "NONE" | "VOUCHER" | "PRODUCT" | "EXCURSION" | "ROOM";

const emptyForm: CampaignInput = {
	name: "",
	imageUrl: "",
	altText: "",
	placement: "HOME_HERO",
	voucherId: null,
	productId: null,
	excursionId: null,
	roomTypeId: null,
	title: "",
	subtitle: "",
	linkUrl: "",
	startDate: "",
	endDate: "",
	priority: 0,
	active: true,
};

interface RoomTypeOption extends RoomType {
	hotelName: string;
}

function checkImageDimensions(url: string, placement: CampaignPlacement): Promise<{ ok: boolean; width: number; height: number }> {
	return new Promise((resolve) => {
		const expected = PLACEMENT_DIMENSIONS[placement];
		const img = new window.Image();
		img.onload = () => {
			const expectedRatio = expected.width / expected.height;
			const actualRatio = img.naturalWidth / img.naturalHeight;
			const withinRatio = Math.abs(actualRatio - expectedRatio) / expectedRatio <= 0.08;
			const minWidth = img.naturalWidth >= expected.width * 0.5;
			resolve({ ok: withinRatio && minWidth, width: img.naturalWidth, height: img.naturalHeight });
		};
		img.onerror = () => resolve({ ok: false, width: 0, height: 0 });
		img.src = url;
	});
}

function targetTypeOf(form: CampaignInput): TargetType {
	if (form.voucherId) return "VOUCHER";
	if (form.productId) return "PRODUCT";
	if (form.excursionId) return "EXCURSION";
	if (form.roomTypeId) return "ROOM";
	return "NONE";
}

export default function CampaignsPage() {
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [vouchers, setVouchers] = useState<Voucher[]>([]);
	const [excursoes, setExcursoes] = useState<Excursao[]>([]);
	const [produtos, setProdutos] = useState<Produto[]>([]);
	const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<Campaign | null>(null);
	const [form, setForm] = useState<CampaignInput>(emptyForm);
	const [targetType, setTargetType] = useState<TargetType>("NONE");
	const [saving, setSaving] = useState(false);
	const [imageWarning, setImageWarning] = useState<string | null>(null);
	const isAdmin = getUser()?.role === "ADMIN";

	const load = async () => {
		setLoading(true);
		try {
			const [campaignsData, vouchersData, excursoesData, produtosData, hotels] = await Promise.all([
				campaignsService.getAll(),
				vouchersService.getAll(),
				excursoesService.getAll(),
				productsService.getAll(),
				hotelService.getHotels(),
			]);
			setCampaigns(campaignsData);
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
			console.error("Error loading campaigns:", error);
			Swal.fire("Erro", "Erro ao carregar campanhas", "error");
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
		setTargetType("NONE");
		setImageWarning(null);
		setShowForm(true);
	};

	const openEdit = (campaign: Campaign) => {
		setEditing(campaign);
		const next: CampaignInput = {
			name: campaign.name,
			imageUrl: campaign.imageUrl,
			altText: campaign.altText ?? "",
			placement: campaign.placement,
			voucherId: campaign.voucherId,
			productId: campaign.productId,
			excursionId: campaign.excursionId,
			roomTypeId: campaign.roomTypeId,
			title: campaign.title ?? "",
			subtitle: campaign.subtitle ?? "",
			linkUrl: campaign.linkUrl ?? "",
			startDate: campaign.startDate ?? "",
			endDate: campaign.endDate ?? "",
			priority: campaign.priority,
			active: campaign.active,
		};
		setForm(next);
		setTargetType(targetTypeOf(next));
		setImageWarning(null);
		setShowForm(true);
	};

	const canManage = (campaign: Campaign) => isAdmin || campaign.createdById === getUser()?.id;

	const handleImageChange = async (url: string) => {
		setForm((f) => ({ ...f, imageUrl: url }));
		if (!url) {
			setImageWarning(null);
			return;
		}
		const result = await checkImageDimensions(url, form.placement);
		if (!result.ok) {
			const expected = PLACEMENT_DIMENSIONS[form.placement];
			setImageWarning(
				`Esta imagem (${result.width}×${result.height}) não respeita a proporção recomendada para "${PLACEMENT_LABELS[form.placement]}" (${expected.width}×${expected.height}). Escolhe outra imagem antes de guardar.`
			);
		} else {
			setImageWarning(null);
		}
	};

	const handlePlacementChange = async (placement: CampaignPlacement) => {
		setForm((f) => ({ ...f, placement }));
		if (form.imageUrl) {
			const result = await checkImageDimensions(form.imageUrl, placement);
			if (!result.ok) {
				const expected = PLACEMENT_DIMENSIONS[placement];
				setImageWarning(
					`Esta imagem (${result.width}×${result.height}) não respeita a proporção recomendada para "${PLACEMENT_LABELS[placement]}" (${expected.width}×${expected.height}). Escolhe outra imagem antes de guardar.`
				);
			} else {
				setImageWarning(null);
			}
		}
	};

	const handleTargetTypeChange = (type: TargetType) => {
		setTargetType(type);
		setForm((f) => ({ ...f, voucherId: null, productId: null, excursionId: null, roomTypeId: null }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (imageWarning) {
			Swal.fire("Imagem fora do tamanho recomendado", imageWarning, "error");
			return;
		}
		setSaving(true);
		try {
			const payload: CampaignInput = {
				...form,
				altText: form.altText || undefined,
				title: form.title || undefined,
				subtitle: form.subtitle || undefined,
				linkUrl: form.linkUrl || undefined,
				startDate: form.startDate || null,
				endDate: form.endDate || null,
			};
			if (editing) {
				await campaignsService.update(editing.id, payload);
			} else {
				await campaignsService.create(payload);
			}
			setShowForm(false);
			await load();
			Swal.fire("Sucesso", editing ? "Campanha atualizada." : "Campanha criada.", "success");
		} catch (error) {
			console.error("Error saving campaign:", error);
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar a campanha", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (campaign: Campaign) => {
		const result = await Swal.fire({
			title: `Apagar a campanha "${campaign.name}"?`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sim, apagar!",
		});
		if (!result.isConfirmed) return;
		try {
			await campaignsService.delete(campaign.id);
			await load();
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível apagar a campanha", "error");
		}
	};

	const statusClass = (status: string) => {
		switch (status) {
			case "Ativa":
				return "bg-green-200 text-green-900";
			case "Agendada":
				return "bg-yellow-200 text-yellow-900";
			case "Expirada":
			case "Alvo indisponível":
				return "bg-red-200 text-red-900";
			default:
				return "bg-gray-200 text-gray-700";
		}
	};

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando campanhas...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Publicidade e Campanhas</h1>
				<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={openCreate}>
					+ Criar
				</button>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							{["Imagem", "Nome", "Placement", "Ligação", "Validade", "Prioridade", "Cliques", "Estado", "Ações"].map((h) => (
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
						{campaigns.map((campaign) => (
							<tr key={campaign.id}>
								<td className="border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
									<img src={campaign.imageUrl} alt="" className="h-10 w-16 rounded object-cover" />
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{campaign.name}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{PLACEMENT_LABELS[campaign.placement]}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{campaign.targetLabel ?? <span className="italic text-gray-400">Manual</span>}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{campaign.startDate || "—"} → {campaign.endDate || "—"}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{campaign.priority}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
									{campaign.clickCount}
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
									<span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(campaign.status)}`}>{campaign.status}</span>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
									{canManage(campaign) && (
										<div className="flex flex-col items-start gap-1">
											<button className="text-blue-600 hover:text-blue-900" onClick={() => openEdit(campaign)}>Editar</button>
											<button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(campaign)}>Apagar</button>
										</div>
									)}
								</td>
							</tr>
						))}
						{campaigns.length === 0 && (
							<tr>
								<td colSpan={9} className="px-5 py-6 text-center text-sm text-gray-500 dark:bg-gray-800">Sem campanhas.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{showForm && (
				<Modal title={editing ? "Editar Campanha" : "Criar Campanha"} onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome interno</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								placeholder="ex: Promoção de verão — hero"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
								Onde aparece — tamanho recomendado: {PLACEMENT_DIMENSIONS[form.placement].width}×{PLACEMENT_DIMENSIONS[form.placement].height}
							</label>
							<select
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.placement}
								onChange={(e) => handlePlacementChange(e.target.value as CampaignPlacement)}
							>
								{Object.entries(PLACEMENT_LABELS).map(([value, label]) => (
									<option key={value} value={value}>{label}</option>
								))}
							</select>
						</div>

						<ImagePicker label="Imagem do banner" value={form.imageUrl} onChange={handleImageChange} />
						{imageWarning && <p className="text-sm text-red-600">{imageWarning}</p>}

						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Texto alternativo (opcional)</label>
							<input
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.altText ?? ""}
								onChange={(e) => setForm({ ...form, altText: e.target.value })}
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Ligado a</label>
							<select
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={targetType}
								onChange={(e) => handleTargetTypeChange(e.target.value as TargetType)}
							>
								<option value="NONE">Nenhum — banner manual</option>
								<option value="VOUCHER">Voucher</option>
								<option value="PRODUCT">Produto</option>
								<option value="EXCURSION">Excursão</option>
								<option value="ROOM">Tipo de Quarto</option>
							</select>
						</div>

						{targetType === "VOUCHER" && (
							<select
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.voucherId ?? ""}
								onChange={(e) => setForm({ ...form, voucherId: e.target.value ? Number(e.target.value) : null })}
							>
								<option value="">Escolhe um voucher</option>
								{vouchers.map((v) => (
									<option key={v.id} value={v.id}>{v.code ?? `Promoção #${v.id}`} (-{v.discountPercent}%)</option>
								))}
							</select>
						)}
						{targetType === "PRODUCT" && (
							<select
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.productId ?? ""}
								onChange={(e) => setForm({ ...form, productId: e.target.value ? Number(e.target.value) : null })}
							>
								<option value="">Escolhe um produto</option>
								{produtos.map((p) => (
									<option key={p.id} value={p.id}>{p.titulo}</option>
								))}
							</select>
						)}
						{targetType === "EXCURSION" && (
							<select
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.excursionId ?? ""}
								onChange={(e) => setForm({ ...form, excursionId: e.target.value ? Number(e.target.value) : null })}
							>
								<option value="">Escolhe uma excursão</option>
								{excursoes.map((ex) => (
									<option key={ex.id} value={ex.id}>{ex.title}</option>
								))}
							</select>
						)}
						{targetType === "ROOM" && (
							<select
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.roomTypeId ?? ""}
								onChange={(e) => setForm({ ...form, roomTypeId: e.target.value ? Number(e.target.value) : null })}
							>
								<option value="">Escolhe um tipo de quarto</option>
								{roomTypes.map((rt) => (
									<option key={rt.id} value={rt.id}>{rt.hotelName} — {rt.name}</option>
								))}
							</select>
						)}

						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
								Título {targetType !== "NONE" && "(opcional — substitui o automático)"}
							</label>
							<input
								required={targetType === "NONE"}
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.title ?? ""}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Subtítulo (opcional)</label>
							<input
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.subtitle ?? ""}
								onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
								Link {targetType !== "NONE" && "(opcional — substitui o automático)"}
							</label>
							<input
								required={targetType === "NONE"}
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								placeholder="/loja"
								value={form.linkUrl ?? ""}
								onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Início (opcional)</label>
								<input
									type="date"
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.startDate ?? ""}
									onChange={(e) => setForm({ ...form, startDate: e.target.value })}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Fim (opcional)</label>
								<input
									type="date"
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.endDate ?? ""}
									onChange={(e) => setForm({ ...form, endDate: e.target.value })}
								/>
							</div>
						</div>

						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
								Prioridade (mais alto aparece primeiro quando há mais que uma campanha ativa no mesmo lugar)
							</label>
							<input
								type="number"
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.priority}
								onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
							/>
						</div>

						<label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
							<input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
							Ativa
						</label>

						<button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
							{saving ? "A guardar..." : editing ? "Guardar Alterações" : "Criar Campanha"}
						</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
