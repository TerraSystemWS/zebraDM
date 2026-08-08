"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Hotel, Reservation, Room, RoomType, hotelService } from "@/services/hotelService";
import Modal from "@/components/Modal";
import { getUser } from "@/lib/api";
import { roomLabel } from "@/lib/roomLabel";

const NOT_YET_PAID_STATUSES = ["PENDING_PAYMENT", "AWAITING_TRANSFER", "AWAITING_CASH", "CANCELLED", "FAILED"];
const CHECK_IN_ELIGIBLE_STATUSES = ["CONFIRMED"];

const STATUS_LABELS: Record<string, string> = {
	PENDING_PAYMENT: "Pendente",
	AWAITING_TRANSFER: "Aguarda Transferência",
	AWAITING_CASH: "Aguarda Pagamento",
	ON_HOLD: "Em Espera",
	CONFIRMED: "Confirmada",
	CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
	PENDING_PAYMENT: "bg-yellow-200 text-yellow-900",
	AWAITING_TRANSFER: "bg-yellow-200 text-yellow-900",
	AWAITING_CASH: "bg-yellow-200 text-yellow-900",
	ON_HOLD: "bg-orange-200 text-orange-900",
	CONFIRMED: "bg-green-200 text-green-900",
	CANCELLED: "bg-red-200 text-red-900",
};

const emptyForm = {
	roomId: 0,
	guestName: "",
	guestEmail: "",
	guestPhone: "",
	checkIn: "",
	checkOut: "",
	guests: 1,
	paymentMethod: "CASH",
	status: "CONFIRMED",
};

export default function HotelReservasPage() {
	const [hotels, setHotels] = useState<Hotel[]>([]);
	const [hotelId, setHotelId] = useState<number | null>(null);
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
	const [rooms, setRooms] = useState<Room[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);
	const [guestFilter, setGuestFilter] = useState("");
	const [roomFilter, setRoomFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const isAdmin = getUser()?.role === "ADMIN";

	useEffect(() => {
		hotelService.getHotels().then((data) => {
			setHotels(data);
			if (data.length > 0) setHotelId(data[0].id);
			else setLoading(false);
		});
	}, []);

	useEffect(() => {
		if (hotelId != null) loadData(hotelId);
	}, [hotelId]);

	const loadData = async (id: number) => {
		setLoading(true);
		try {
			const [res, types] = await Promise.all([hotelService.getReservations(id), hotelService.getRoomTypes(id)]);
			setReservations(res.sort((a, b) => a.checkIn.localeCompare(b.checkIn)));
			setRoomTypes(types);
			const roomLists = await Promise.all(types.map((t) => hotelService.getRooms(t.id)));
			setRooms(roomLists.flat());
		} catch (error) {
			console.error(error);
			Swal.fire("Erro", "Erro ao carregar reservas", "error");
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setForm({ ...emptyForm, roomId: rooms[0]?.id || 0 });
		setShowForm(true);
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.roomId) {
			Swal.fire("Erro", "Escolha um quarto", "error");
			return;
		}
		setSaving(true);
		try {
			await hotelService.createReservationAsAdmin(form);
			setShowForm(false);
			if (hotelId != null) await loadData(hotelId);
			Swal.fire("Sucesso", "Reserva criada.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível criar a reserva", "error");
		} finally {
			setSaving(false);
		}
	};

	const changeStatus = async (reservation: Reservation) => {
		const { value: status } = await Swal.fire({
			title: "Alterar Estado",
			input: "select",
			inputOptions: {
				ON_HOLD: "Em Espera",
				CONFIRMED: "Confirmada",
				CANCELLED: "Cancelada",
			},
			inputValue: reservation.status,
			showCancelButton: true,
		});
		if (status) {
			try {
				await hotelService.updateReservationStatus(reservation.id, status);
				if (hotelId != null) await loadData(hotelId);
			} catch {
				Swal.fire("Erro", "Não foi possível alterar o estado", "error");
			}
		}
	};

	const doCheckIn = async (reservation: Reservation) => {
		try {
			await hotelService.checkIn(reservation.id);
			if (hotelId != null) await loadData(hotelId);
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível fazer o check-in", "error");
		}
	};

	const doCheckOut = async (reservation: Reservation) => {
		try {
			await hotelService.checkOut(reservation.id);
			if (hotelId != null) await loadData(hotelId);
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível fazer o check-out", "error");
		}
	};

	const canDelete = (reservation: Reservation) =>
		reservation.status !== "CONFIRMED" && (isAdmin || NOT_YET_PAID_STATUSES.includes(reservation.status));

	const doDelete = async (reservation: Reservation) => {
		const result = await Swal.fire({
			title: `Apagar reserva de "${reservation.guestName}"?`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Sim, apagar!",
		});
		if (!result.isConfirmed) return;
		try {
			await hotelService.deleteReservation(reservation.id);
			if (hotelId != null) await loadData(hotelId);
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível apagar a reserva", "error");
		}
	};

	const filteredReservations = useMemo(() => {
		const guestQuery = guestFilter.trim().toLowerCase();
		const roomQuery = roomFilter.trim().toLowerCase();
		return reservations.filter((r) => {
			if (guestQuery && !r.guestName.toLowerCase().includes(guestQuery)) return false;
			if (roomQuery && !(r.roomNumber || "").toLowerCase().includes(roomQuery) && !(r.roomTypeName || "").toLowerCase().includes(roomQuery)) return false;
			if (statusFilter && r.status !== statusFilter) return false;
			return true;
		});
	}, [reservations, guestFilter, roomFilter, statusFilter]);

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reservas de Quartos</h1>
				<div className="flex items-center gap-3">
					{hotels.length > 0 && (
						<select
							className="rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							value={hotelId ?? ""}
							onChange={(e) => setHotelId(Number(e.target.value))}
						>
							{hotels.map((h) => (
								<option key={h.id} value={h.id}>{h.name}</option>
							))}
						</select>
					)}
					<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={openCreate} disabled={rooms.length === 0}>
						Nova Reserva
					</button>
				</div>
			</div>

			{hotels.length === 0 ? (
				<p className="text-gray-500">Crie primeiro um hotel em &quot;Hotéis&quot;.</p>
			) : loading ? (
				<div className="text-gray-600 dark:text-gray-300">Carregando...</div>
			) : (
				<>
					<div className="mb-4 grid gap-3 sm:grid-cols-3">
						<input
							className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							placeholder="Pesquisar por hóspede..."
							value={guestFilter}
							onChange={(e) => setGuestFilter(e.target.value)}
						/>
						<input
							className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							placeholder="Pesquisar por quarto..."
							value={roomFilter}
							onChange={(e) => setRoomFilter(e.target.value)}
						/>
						<select
							className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
						>
							<option value="">Todos os estados</option>
							{Object.entries(STATUS_LABELS).map(([value, label]) => (
								<option key={value} value={value}>{label}</option>
							))}
						</select>
					</div>

					<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
						<table className="min-w-full leading-normal">
							<thead>
								<tr>
									{["Hóspede", "Quarto", "Check-in", "Check-out", "Valor", "Estado", "Estadia", "Ações"].map((h) => (
										<th key={h} className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{filteredReservations.map((r) => (
									<tr key={r.id}>
										<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">{r.guestName}</td>
										<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">{roomLabel(r.roomNumber, r.roomTypeName)}</td>
										<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">{r.checkIn}</td>
										<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">{r.checkOut}</td>
										<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">${r.totalAmount}</td>
										<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
											<span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[r.status] || "bg-gray-200 text-gray-900"}`}>
												{STATUS_LABELS[r.status] || r.status}
											</span>
										</td>
										<td className="border-b border-gray-200 bg-white px-5 py-4 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white">
											{r.checkedOutAt ? (
												<span className="text-gray-500">Check-out feito</span>
											) : r.checkedInAt ? (
												<button className="text-blue-600 hover:text-blue-900" onClick={() => doCheckOut(r)}>Fazer Check-out</button>
											) : CHECK_IN_ELIGIBLE_STATUSES.includes(r.status) ? (
												<button className="text-blue-600 hover:text-blue-900" onClick={() => doCheckIn(r)}>Fazer Check-in</button>
											) : (
												<span className="text-gray-400">—</span>
											)}
										</td>
										<td className="border-b border-gray-200 bg-white px-5 py-4 text-sm dark:border-gray-700 dark:bg-gray-800">
											<div className="flex flex-col items-start gap-1">
												<button className="text-blue-600 hover:text-blue-900" onClick={() => changeStatus(r)}>Alterar Estado</button>
												{canDelete(r) && (
													<button className="text-red-600 hover:text-red-900" onClick={() => doDelete(r)}>Apagar</button>
												)}
											</div>
										</td>
									</tr>
								))}
								{filteredReservations.length === 0 && (
									<tr>
										<td colSpan={8} className="px-5 py-6 text-center text-sm text-gray-500 dark:bg-gray-800">Sem reservas.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</>
			)}

			{showForm && (
				<Modal title="Nova Reserva Manual" onClose={() => setShowForm(false)}>
					<form onSubmit={submit} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Quarto</label>
							<select required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: Number(e.target.value) })}>
								{rooms.map((room) => {
									const rt = roomTypes.find((t) => t.id === room.roomTypeId);
									return <option key={room.id} value={room.id}>{roomLabel(room.roomNumber, rt?.name || "")}</option>;
								})}
							</select>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome do Hóspede</label>
							<input required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
								<input type="email" className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Telefone</label>
								<input className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Check-in</label>
								<input type="date" required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Check-out</label>
								<input type="date" required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Hóspedes</label>
								<input type="number" min={1} required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Pagamento</label>
								<select className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
									<option value="CASH">Dinheiro</option>
									<option value="TRANSFER">Transferência</option>
									<option value="ONLINE">Online</option>
								</select>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Estado Inicial</label>
							<select className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
								<option value="CONFIRMED">Confirmada</option>
								<option value="ON_HOLD">Em Espera</option>
							</select>
							<p className="mt-1 text-xs text-gray-500">Só o admin pode colocar uma reserva &quot;Em Espera&quot;.</p>
						</div>
						<button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
							{saving ? "A guardar..." : "Criar Reserva"}
						</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
