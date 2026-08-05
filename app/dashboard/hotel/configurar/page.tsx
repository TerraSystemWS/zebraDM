"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Hotel, HotelAmenity, Room, RoomType, hotelService } from "@/services/hotelService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";

const emptyHotel = { name: "", address: "", city: "", description: "", image: "" };
const emptyRoomType = { name: "", description: "", basePrice: 0, capacity: 2, image: "" };
const emptyRoom = { roomNumber: "", floor: "", status: "ACTIVE", images: [] as string[], amenities: [] as string[] };

export default function HotelConfigurarPage() {
	const [hotels, setHotels] = useState<Hotel[]>([]);
	const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
	const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
	const [roomsByType, setRoomsByType] = useState<Record<number, Room[]>>({});
	const [amenities, setAmenities] = useState<HotelAmenity[]>([]);
	const [loading, setLoading] = useState(true);

	const [hotelForm, setHotelForm] = useState<typeof emptyHotel | null>(null);
	const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

	const [roomTypeForm, setRoomTypeForm] = useState<typeof emptyRoomType | null>(null);
	const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);

	const [roomForm, setRoomForm] = useState<{ typeId: number; data: typeof emptyRoom } | null>(null);
	const [editingRoom, setEditingRoom] = useState<Room | null>(null);

	useEffect(() => {
		loadHotels();
		hotelService.getAmenities().then(setAmenities).catch(() => {});
	}, []);

	useEffect(() => {
		if (selectedHotel) loadRoomTypes(selectedHotel.id);
	}, [selectedHotel]);

	const loadHotels = async () => {
		setLoading(true);
		try {
			const data = await hotelService.getHotels();
			setHotels(data);
			if (data.length > 0 && !selectedHotel) setSelectedHotel(data[0]);
		} catch (error) {
			console.error(error);
			Swal.fire("Erro", "Erro ao carregar hotéis", "error");
		} finally {
			setLoading(false);
		}
	};

	const loadRoomTypes = async (hotelId: number) => {
		const types = await hotelService.getRoomTypes(hotelId);
		setRoomTypes(types);
		const roomsEntries = await Promise.all(types.map(async (t) => [t.id, await hotelService.getRooms(t.id)] as const));
		setRoomsByType(Object.fromEntries(roomsEntries));
	};

	// ---- Hotel CRUD ----
	const openCreateHotel = () => {
		setEditingHotel(null);
		setHotelForm(emptyHotel);
	};
	const openEditHotel = (hotel: Hotel) => {
		setEditingHotel(hotel);
		setHotelForm({ name: hotel.name, address: hotel.address || "", city: hotel.city || "", description: hotel.description || "", image: hotel.image || "" });
	};
	const submitHotel = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!hotelForm) return;
		try {
			if (editingHotel) await hotelService.updateHotel(editingHotel.id, hotelForm);
			else await hotelService.createHotel(hotelForm);
			setHotelForm(null);
			await loadHotels();
			Swal.fire("Sucesso", "Hotel guardado.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar", "error");
		}
	};
	const deleteHotel = async (hotel: Hotel) => {
		const result = await Swal.fire({ title: `Apagar "${hotel.name}"?`, icon: "warning", showCancelButton: true, confirmButtonText: "Sim, apagar!" });
		if (result.isConfirmed) {
			await hotelService.deleteHotel(hotel.id);
			if (selectedHotel?.id === hotel.id) setSelectedHotel(null);
			await loadHotels();
		}
	};

	// ---- RoomType CRUD ----
	const openCreateRoomType = () => {
		setEditingRoomType(null);
		setRoomTypeForm(emptyRoomType);
	};
	const openEditRoomType = (rt: RoomType) => {
		setEditingRoomType(rt);
		setRoomTypeForm({
			name: rt.name,
			description: rt.description || "",
			basePrice: rt.basePrice,
			capacity: rt.capacity,
			image: rt.image || "",
		});
	};
	const submitRoomType = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!roomTypeForm || !selectedHotel) return;
		try {
			if (editingRoomType) await hotelService.updateRoomType(editingRoomType.id, roomTypeForm);
			else await hotelService.createRoomType(selectedHotel.id, roomTypeForm);
			setRoomTypeForm(null);
			await loadRoomTypes(selectedHotel.id);
			Swal.fire("Sucesso", "Tipo de quarto guardado.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar", "error");
		}
	};
	const deleteRoomType = async (rt: RoomType) => {
		const result = await Swal.fire({ title: `Apagar "${rt.name}"?`, icon: "warning", showCancelButton: true, confirmButtonText: "Sim, apagar!" });
		if (result.isConfirmed && selectedHotel) {
			await hotelService.deleteRoomType(rt.id);
			await loadRoomTypes(selectedHotel.id);
		}
	};

	// ---- Room CRUD ----
	const openCreateRoom = (typeId: number) => {
		setEditingRoom(null);
		setRoomForm({ typeId, data: emptyRoom });
	};
	const openEditRoom = (typeId: number, room: Room) => {
		setEditingRoom(room);
		setRoomForm({ typeId, data: { roomNumber: room.roomNumber, floor: room.floor || "", status: room.status, images: room.images || [], amenities: room.amenities || [] } });
	};
	const toggleRoomAmenity = (code: string) => {
		if (!roomForm) return;
		const has = roomForm.data.amenities.includes(code);
		setRoomForm({
			...roomForm,
			data: {
				...roomForm.data,
				amenities: has ? roomForm.data.amenities.filter((a) => a !== code) : [...roomForm.data.amenities, code],
			},
		});
	};
	const submitRoom = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!roomForm || !selectedHotel) return;
		try {
			if (editingRoom) await hotelService.updateRoom(editingRoom.id, roomForm.data);
			else await hotelService.createRoom(roomForm.typeId, roomForm.data);
			setRoomForm(null);
			await loadRoomTypes(selectedHotel.id);
			Swal.fire("Sucesso", "Quarto guardado.", "success");
		} catch (error) {
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar", "error");
		}
	};
	const deleteRoom = async (room: Room) => {
		const result = await Swal.fire({ title: `Apagar o quarto "${room.roomNumber}"?`, icon: "warning", showCancelButton: true, confirmButtonText: "Sim, apagar!" });
		if (result.isConfirmed && selectedHotel) {
			await hotelService.deleteRoom(room.id);
			await loadRoomTypes(selectedHotel.id);
		}
	};

	if (loading) return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando...</div>;

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Editar / Configurar Hotéis</h1>
				<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={openCreateHotel}>
					Novo Hotel
				</button>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-1">
					<div className="rounded-lg bg-white shadow dark:bg-gray-800">
						{hotels.map((hotel) => (
							<div
								key={hotel.id}
								className={`flex flex-wrap cursor-pointer items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700 ${selectedHotel?.id === hotel.id ? "bg-blue-50 dark:bg-gray-700" : ""}`}
								onClick={() => setSelectedHotel(hotel)}
							>
								<div>
									<p className="font-medium text-gray-800 dark:text-white">{hotel.name}</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">{hotel.city}</p>
								</div>
								<div className="flex gap-2 text-sm">
									<button className="text-blue-600" onClick={(e) => { e.stopPropagation(); openEditHotel(hotel); }}>Editar</button>
									<button className="text-red-600" onClick={(e) => { e.stopPropagation(); deleteHotel(hotel); }}>Apagar</button>
								</div>
							</div>
						))}
						{hotels.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhum hotel criado.</p>}
					</div>
				</div>

				<div className="lg:col-span-2">
					{selectedHotel ? (
						<>
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<h2 className="text-lg font-bold text-gray-800 dark:text-white">Tipos de Quarto — {selectedHotel.name}</h2>
								<button className="rounded bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700" onClick={openCreateRoomType}>
									Novo Tipo de Quarto
								</button>
							</div>

							<div className="grid gap-4">
								{roomTypes.map((rt) => (
									<div key={rt.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<p className="font-semibold text-gray-800 dark:text-white">{rt.name}</p>
												<p className="text-sm text-gray-500 dark:text-gray-400">
													${rt.basePrice}/noite &middot; até {rt.capacity} pessoas
												</p>
											</div>
											<div className="flex gap-2 text-sm">
												<button className="text-blue-600" onClick={() => openEditRoomType(rt)}>Editar</button>
												<button className="text-red-600" onClick={() => deleteRoomType(rt)}>Apagar</button>
											</div>
										</div>

										<div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
											<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
												<p className="text-sm font-medium text-gray-600 dark:text-gray-300">Quartos</p>
												<button className="text-sm text-blue-600" onClick={() => openCreateRoom(rt.id)}>+ Adicionar quarto</button>
											</div>
											<div className="flex flex-wrap gap-2">
												{(roomsByType[rt.id] || []).map((room) => (
													<div key={room.id} className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-600">
														<span>{room.roomNumber}</span>
														<button className="text-blue-600" onClick={() => openEditRoom(rt.id, room)}>✎</button>
														<button className="text-red-600" onClick={() => deleteRoom(room)}>✕</button>
													</div>
												))}
												{(roomsByType[rt.id] || []).length === 0 && <span className="text-xs text-gray-400">Sem quartos.</span>}
											</div>
										</div>
									</div>
								))}
								{roomTypes.length === 0 && <p className="text-sm text-gray-500">Nenhum tipo de quarto criado.</p>}
							</div>
						</>
					) : (
						<p className="text-gray-500">Selecione ou crie um hotel.</p>
					)}
				</div>
			</div>

			{hotelForm && (
				<Modal title={editingHotel ? "Editar Hotel" : "Novo Hotel"} onClose={() => setHotelForm(null)}>
					<form onSubmit={submitHotel} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome</label>
							<input required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={hotelForm.name} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} />
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Morada</label>
							<input className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={hotelForm.address} onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })} />
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Cidade</label>
							<input className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={hotelForm.city} onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })} />
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Descrição</label>
							<textarea rows={3} className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={hotelForm.description} onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })} />
						</div>
						<ImagePicker label="Imagem" value={hotelForm.image} onChange={(url) => setHotelForm({ ...hotelForm, image: url })} />
						<button type="submit" className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Guardar</button>
					</form>
				</Modal>
			)}

			{roomTypeForm && (
				<Modal title={editingRoomType ? "Editar Tipo de Quarto" : "Novo Tipo de Quarto"} onClose={() => setRoomTypeForm(null)}>
					<form onSubmit={submitRoomType} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome</label>
							<input required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={roomTypeForm.name} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Preço/noite ($)</label>
								<input type="number" step="0.01" required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={roomTypeForm.basePrice} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, basePrice: Number(e.target.value) })} />
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Capacidade</label>
								<input type="number" required className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={roomTypeForm.capacity} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, capacity: Number(e.target.value) })} />
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Descrição</label>
							<textarea rows={3} className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={roomTypeForm.description} onChange={(e) => setRoomTypeForm({ ...roomTypeForm, description: e.target.value })} />
						</div>
						<ImagePicker label="Imagem de Capa" value={roomTypeForm.image} onChange={(url) => setRoomTypeForm({ ...roomTypeForm, image: url })} />
						<p className="text-xs text-gray-500 dark:text-gray-400">Galeria de fotos e comodidades definem-se por quarto individual (abaixo, em "Editar quarto").</p>
						<button type="submit" className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Guardar</button>
					</form>
				</Modal>
			)}

			{roomForm && (
				<Modal title={editingRoom ? "Editar Quarto" : "Novo Quarto"} onClose={() => setRoomForm(null)}>
					<form onSubmit={submitRoom} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Código do Quarto</label>
							<input required placeholder="ex: R22" className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={roomForm.data.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, data: { ...roomForm.data, roomNumber: e.target.value } })} />
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">É este código que aparece em todo o lado (site, reservas, calendário) — ex: "R22" mostra-se como "R22 - {roomTypes.find((t) => t.id === roomForm.typeId)?.name || "Nome do Tipo"}". Tem de ser único dentro deste hotel.</p>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Piso</label>
							<input className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={roomForm.data.floor} onChange={(e) => setRoomForm({ ...roomForm, data: { ...roomForm.data, floor: e.target.value } })} />
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Estado</label>
							<select className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={roomForm.data.status} onChange={(e) => setRoomForm({ ...roomForm, data: { ...roomForm.data, status: e.target.value } })}>
								<option value="ACTIVE">Ativo</option>
								<option value="MAINTENANCE">Em Manutenção</option>
							</select>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Imagens do Quarto</label>
							{roomForm.data.images.length > 0 && (
								<div className="mb-2 flex flex-wrap gap-2">
									{roomForm.data.images.map((url, idx) => (
										<div key={idx} className="relative">
											<img src={url} alt="" className="h-16 w-16 rounded object-cover border border-gray-300 dark:border-gray-600" />
											<button
												type="button"
												className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
												onClick={() =>
													setRoomForm({
														...roomForm,
														data: { ...roomForm.data, images: roomForm.data.images.filter((_, i) => i !== idx) },
													})
												}
											>
												✕
											</button>
										</div>
									))}
								</div>
							)}
							<ImagePicker
								label="Adicionar imagem"
								value=""
								onChange={(url) =>
									setRoomForm({ ...roomForm, data: { ...roomForm.data, images: [...roomForm.data.images, url] } })
								}
							/>
						</div>
						<div>
							<label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">Comodidades</label>
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
								{amenities.map((amenity) => (
									<label key={amenity.code} className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-600">
										<input
											type="checkbox"
											checked={roomForm.data.amenities.includes(amenity.code)}
											onChange={() => toggleRoomAmenity(amenity.code)}
										/>
										{amenity.label}
									</label>
								))}
							</div>
						</div>
						<button type="submit" className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Guardar</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
