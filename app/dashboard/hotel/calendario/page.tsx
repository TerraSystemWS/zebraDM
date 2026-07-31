"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Hotel, Reservation, hotelService } from "@/services/hotelService";
import Modal from "@/components/Modal";
import { roomLabel } from "@/lib/roomLabel";

const STATUS_LABELS: Record<string, string> = {
	PENDING_PAYMENT: "Pendente",
	AWAITING_TRANSFER: "Aguarda Transferência",
	AWAITING_CASH: "Aguarda Pagamento",
	ON_HOLD: "Em Espera",
	CONFIRMED: "Confirmada",
	PAID: "Paga",
	CANCELLED: "Cancelada",
};

const SETTABLE_STATUSES = ["ON_HOLD", "CONFIRMED", "PAID", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
	PENDING_PAYMENT: "bg-yellow-200 text-yellow-900 border-yellow-400",
	AWAITING_TRANSFER: "bg-yellow-200 text-yellow-900 border-yellow-400",
	AWAITING_CASH: "bg-yellow-200 text-yellow-900 border-yellow-400",
	ON_HOLD: "bg-orange-200 text-orange-900 border-orange-400",
	CONFIRMED: "bg-green-200 text-green-900 border-green-400",
	PAID: "bg-green-200 text-green-900 border-green-400",
	CANCELLED: "bg-red-200 text-red-900 border-red-400 line-through opacity-60",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toIso(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
	const copy = new Date(d);
	copy.setDate(copy.getDate() + days);
	return copy;
}

function buildMonthGrid(monthStart: Date): Date[] {
	const firstDayWeekday = monthStart.getDay();
	const gridStart = addDays(monthStart, -firstDayWeekday);
	return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export default function HotelCalendarioPage() {
	const [hotels, setHotels] = useState<Hotel[]>([]);
	const [hotelId, setHotelId] = useState<number | null>(null);
	const [monthStart, setMonthStart] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [loading, setLoading] = useState(true);
	const [dragId, setDragId] = useState<number | null>(null);
	const [dragOverDate, setDragOverDate] = useState<string | null>(null);
	const [editing, setEditing] = useState<Reservation | null>(null);
	const [editForm, setEditForm] = useState({ checkIn: "", checkOut: "", status: "" });
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		hotelService.getHotels().then((data) => {
			setHotels(data);
			if (data.length > 0) setHotelId(data[0].id);
			else setLoading(false);
		});
	}, []);

	useEffect(() => {
		if (hotelId != null) loadReservations();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hotelId, monthStart]);

	const grid = useMemo(() => buildMonthGrid(monthStart), [monthStart]);

	const loadReservations = async () => {
		if (hotelId == null) return;
		setLoading(true);
		try {
			const from = toIso(grid.length ? buildMonthGrid(monthStart)[0] : monthStart);
			const to = toIso(addDays(buildMonthGrid(monthStart)[41], 1));
			const data = await hotelService.getReservations(hotelId, from, to);
			setReservations(data.filter((r) => r.status !== "CANCELLED" && r.status !== "FAILED"));
		} catch (error) {
			console.error(error);
			Swal.fire("Erro", "Erro ao carregar reservas", "error");
		} finally {
			setLoading(false);
		}
	};

	const reservationsForDay = (date: Date): Reservation[] => {
		const iso = toIso(date);
		return reservations.filter((r) => r.checkIn <= iso && r.checkOut > iso);
	};

	const handleDrop = async (date: Date) => {
		setDragOverDate(null);
		if (dragId == null) return;
		const reservation = reservations.find((r) => r.id === dragId);
		setDragId(null);
		if (!reservation) return;

		const nights = Math.round(
			(new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / 86400000
		);
		const newCheckIn = toIso(date);
		const newCheckOut = toIso(addDays(date, nights));
		if (newCheckIn === reservation.checkIn) return;

		try {
			await hotelService.updateReservationDates(reservation.id, newCheckIn, newCheckOut);
			await loadReservations();
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível mover a reserva", "error");
		}
	};

	const openEdit = (reservation: Reservation) => {
		setEditing(reservation);
		setEditForm({ checkIn: reservation.checkIn, checkOut: reservation.checkOut, status: reservation.status });
	};

	const submitEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editing) return;
		setSaving(true);
		try {
			if (editForm.checkIn !== editing.checkIn || editForm.checkOut !== editing.checkOut) {
				await hotelService.updateReservationDates(editing.id, editForm.checkIn, editForm.checkOut);
			}
			if (editForm.status !== editing.status) {
				await hotelService.updateReservationStatus(editing.id, editForm.status);
			}
			setEditing(null);
			await loadReservations();
			Swal.fire("Sucesso", "Reserva atualizada.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível atualizar a reserva", "error");
		} finally {
			setSaving(false);
		}
	};

	const monthLabel = monthStart.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
	const today = toIso(new Date());

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Calendário de Reservas</h1>
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
			</div>

			{hotels.length === 0 ? (
				<p className="text-gray-500">Crie primeiro um hotel em &quot;Editar/Configurar&quot;.</p>
			) : (
				<div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
					<div className="mb-4 flex items-center justify-between">
						<button
							className="rounded bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
							onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
						>
							&larr; Anterior
						</button>
						<h2 className="text-lg font-semibold capitalize text-gray-800 dark:text-white">{monthLabel}</h2>
						<button
							className="rounded bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
							onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
						>
							Seguinte &rarr;
						</button>
					</div>

					<p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
						Arraste uma reserva para outro dia para alterar as datas (mantém o número de noites).
					</p>

					{loading ? (
						<div className="p-6 text-center text-gray-500">Carregando...</div>
					) : (
						<div className="grid grid-cols-7 gap-1">
							{WEEKDAYS.map((wd) => (
								<div key={wd} className="p-1 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
									{wd}
								</div>
							))}
							{grid.map((date) => {
								const iso = toIso(date);
								const inMonth = date.getMonth() === monthStart.getMonth();
								const dayReservations = reservationsForDay(date);
								const isToday = iso === today;
								return (
									<div
										key={iso}
										onDragOver={(e) => {
											e.preventDefault();
											setDragOverDate(iso);
										}}
										onDragLeave={() => setDragOverDate((cur) => (cur === iso ? null : cur))}
										onDrop={(e) => {
											e.preventDefault();
											handleDrop(date);
										}}
										className={`min-h-[90px] rounded border p-1 text-xs ${
											inMonth ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
										} ${dragOverDate === iso ? "ring-2 ring-blue-500" : "border-gray-200 dark:border-gray-700"}`}
									>
										<div className={`mb-1 text-right ${isToday ? "font-bold text-blue-600" : inMonth ? "text-gray-600 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"}`}>
											{date.getDate()}
										</div>
										<div className="flex flex-col">
											{dayReservations.map((r) => (
												<div
													key={r.id}
													draggable
													onDragStart={() => setDragId(r.id)}
													onDragEnd={() => setDragId(null)}
													onClick={() => openEdit(r)}
													title={`${r.guestName} — ${roomLabel(r.roomNumber, r.roomTypeName)} (${r.checkIn} → ${r.checkOut})`}
													className={`flex cursor-pointer items-stretch overflow-hidden truncate border ${STATUS_COLORS[r.status] || "bg-gray-200 text-gray-800 border-gray-400"}`}
												>
													{r.roomImage && (
														<img src={r.roomImage} alt="" className="h-4 w-5 shrink-0 bg-black/5 object-contain" />
													)}
													<span className="min-w-0 flex-1 truncate px-1 py-0.5 cursor-move">
														{r.guestName} · {r.roomNumber}
													</span>
												</div>
											))}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			{editing && (
				<Modal title={`Reserva de ${editing.guestName}`} onClose={() => setEditing(null)}>
					<form onSubmit={submitEdit} className="grid gap-4">
						<p className="text-sm text-gray-600 dark:text-gray-300">
							{roomLabel(editing.roomNumber, editing.roomTypeName)}
						</p>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Check-in</label>
								<input
									type="date"
									required
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={editForm.checkIn}
									onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Check-out</label>
								<input
									type="date"
									required
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={editForm.checkOut}
									onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
								/>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Estado</label>
							<select
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={editForm.status}
								onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
							>
								{Array.from(new Set([editing.status, ...SETTABLE_STATUSES])).map((value) => (
									<option key={value} value={value}>{STATUS_LABELS[value] || value}</option>
								))}
							</select>
							{!SETTABLE_STATUSES.includes(editing.status) && (
								<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
									O estado atual ({STATUS_LABELS[editing.status]}) é definido automaticamente pelo método de pagamento; escolha outro para o alterar manualmente.
								</p>
							)}
						</div>
						<button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
							{saving ? "A guardar..." : "Guardar"}
						</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
