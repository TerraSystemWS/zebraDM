"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Modal from "@/components/Modal";
import { hotelService, ReservationGuest } from "@/services/hotelService";

interface GuestManagerModalProps {
	reservationId: number;
	onClose: () => void;
}

const emptyGuest = { fullName: "", dateOfBirth: "", nationality: "", passportNumber: "" };

export default function GuestManagerModal({ reservationId, onClose }: GuestManagerModalProps) {
	const [guests, setGuests] = useState<ReservationGuest[]>([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState(emptyGuest);
	const [saving, setSaving] = useState(false);
	const [uploadingGuestId, setUploadingGuestId] = useState<number | null>(null);

	const load = async () => {
		setLoading(true);
		try {
			setGuests(await hotelService.getReservationGuests(reservationId));
		} catch {
			Swal.fire("Erro", "Não foi possível carregar os hóspedes", "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reservationId]);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.fullName.trim()) return;
		setSaving(true);
		try {
			await hotelService.addReservationGuest(reservationId, {
				fullName: form.fullName,
				dateOfBirth: form.dateOfBirth || undefined,
				nationality: form.nationality || undefined,
				passportNumber: form.passportNumber || undefined,
			});
			setForm(emptyGuest);
			await load();
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível adicionar o hóspede", "error");
		} finally {
			setSaving(false);
		}
	};

	const remove = async (guestId: number) => {
		const result = await Swal.fire({ title: "Remover hóspede?", icon: "warning", showCancelButton: true, confirmButtonText: "Sim, remover" });
		if (!result.isConfirmed) return;
		try {
			await hotelService.deleteReservationGuest(reservationId, guestId);
			await load();
		} catch {
			Swal.fire("Erro", "Não foi possível remover o hóspede", "error");
		}
	};

	const uploadDocument = async (guestId: number, file: File) => {
		setUploadingGuestId(guestId);
		try {
			await hotelService.uploadGuestDocument(reservationId, guestId, file);
			await load();
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível enviar o ficheiro", "error");
		} finally {
			setUploadingGuestId(null);
		}
	};

	const removeDocument = async (guestId: number, docId: number) => {
		try {
			await hotelService.deleteGuestDocument(reservationId, guestId, docId);
			await load();
		} catch {
			Swal.fire("Erro", "Não foi possível remover o documento", "error");
		}
	};

	const viewDocument = async (guestId: number, docId: number) => {
		try {
			const blob = await hotelService.downloadGuestDocument(reservationId, guestId, docId);
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank");
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		} catch {
			Swal.fire("Erro", "Não foi possível abrir o documento", "error");
		}
	};

	return (
		<Modal title="Hóspedes da Reserva" onClose={onClose}>
			{loading ? (
				<p className="text-gray-600 dark:text-gray-300">Carregando...</p>
			) : (
				<>
					{guests.length === 0 && <p className="text-gray-500">Nenhum hóspede registado ainda.</p>}
					{guests.map((guest) => (
						<div key={guest.id} className="mb-3 rounded border border-gray-200 p-3 dark:border-gray-600">
							<div className="flex items-start justify-between">
								<div>
									<strong className="text-gray-800 dark:text-white">{guest.fullName}</strong>
									{guest.isPrimary && (
										<span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Principal</span>
									)}
									<div className="text-xs text-gray-500 dark:text-gray-400">
										{[guest.dateOfBirth, guest.nationality, guest.passportNumber].filter(Boolean).join(" · ") || "Sem dados adicionais"}
									</div>
								</div>
								<button className="text-sm text-red-600 hover:text-red-900" onClick={() => remove(guest.id)}>
									Remover
								</button>
							</div>

							{guest.documents.length > 0 && (
								<ul className="mt-2 space-y-1">
									{guest.documents.map((doc) => (
										<li key={doc.id} className="flex items-center justify-between text-xs">
											<button className="text-blue-600 hover:underline" onClick={() => viewDocument(guest.id, doc.id)}>
												{doc.originalFilename}
											</button>
											<button className="text-red-600 hover:underline" onClick={() => removeDocument(guest.id, doc.id)}>
												Apagar
											</button>
										</li>
									))}
								</ul>
							)}

							<label className="mt-2 inline-block cursor-pointer text-xs font-medium text-blue-600 hover:underline">
								{uploadingGuestId === guest.id ? "A enviar..." : "+ Anexar foto do passaporte"}
								<input
									type="file"
									accept="image/jpeg,image/png,application/pdf"
									className="hidden"
									disabled={uploadingGuestId === guest.id}
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) uploadDocument(guest.id, file);
										e.target.value = "";
									}}
								/>
							</label>
						</div>
					))}

					<form onSubmit={submit} className="mt-4 grid gap-2 border-t border-gray-200 pt-4 dark:border-gray-600">
						<input
							required
							placeholder="Nome completo"
							className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							value={form.fullName}
							onChange={(e) => setForm({ ...form, fullName: e.target.value })}
						/>
						<div className="grid grid-cols-2 gap-2">
							<input
								type="date"
								className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.dateOfBirth}
								onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
							/>
							<input
								placeholder="Nacionalidade"
								className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.nationality}
								onChange={(e) => setForm({ ...form, nationality: e.target.value })}
							/>
						</div>
						<input
							placeholder="Número de passaporte"
							className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							value={form.passportNumber}
							onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
						/>
						<button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
							{saving ? "A guardar..." : "Adicionar Hóspede"}
						</button>
					</form>
				</>
			)}
		</Modal>
	);
}
