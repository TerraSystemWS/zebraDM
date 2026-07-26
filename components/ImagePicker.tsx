"use client";

import { useEffect, useRef, useState } from "react";
import { MediaFolder, MediaItem, mediaService } from "@/services/mediaService";
import Modal from "@/components/Modal";
import Swal from "sweetalert2";

export default function ImagePicker({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (url: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [tab, setTab] = useState<"library" | "upload">("library");
	const [folders, setFolders] = useState<MediaFolder[]>([]);
	const [items, setItems] = useState<MediaItem[]>([]);
	const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			mediaService.getFolders().then(setFolders).catch(() => {});
			loadItems(currentFolderId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	useEffect(() => {
		if (open) loadItems(currentFolderId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentFolderId]);

	const loadItems = async (folderId: number | null) => {
		setLoading(true);
		try {
			const data = await mediaService.getItems(folderId);
			setItems(data);
		} catch (error) {
			console.error("Error loading media items:", error);
		} finally {
			setLoading(false);
		}
	};

	const subFolders = folders.filter((f) => f.parentId === currentFolderId);

	const select = (url: string) => {
		onChange(url);
		setOpen(false);
	};

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setUploading(true);
		try {
			const item = await mediaService.upload(files[0], currentFolderId);
			select(item.url);
		} catch (error) {
			console.error("Error uploading file:", error);
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível enviar o ficheiro", "error");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	return (
		<div>
			<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">{label}</label>
			<div className="flex items-center gap-3">
				{value ? (
					<img src={value} alt="" className="h-14 w-14 rounded object-cover border border-gray-300 dark:border-gray-600" />
				) : (
					<div className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400 dark:border-gray-600">
						sem imagem
					</div>
				)}
				<input
					className="flex-1 rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="URL da imagem"
				/>
				<button
					type="button"
					className="whitespace-nowrap rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700"
					onClick={() => {
						setTab("library");
						setOpen(true);
					}}
				>
					Escolher
				</button>
			</div>

			{open && (
				<Modal title="Escolher Imagem" onClose={() => setOpen(false)}>
					<div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
						<button
							type="button"
							className={`px-3 py-2 text-sm font-medium ${tab === "library" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
							onClick={() => setTab("library")}
						>
							Media Library
						</button>
						<button
							type="button"
							className={`px-3 py-2 text-sm font-medium ${tab === "upload" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
							onClick={() => setTab("upload")}
						>
							Carregar do PC
						</button>
					</div>

					{tab === "library" && (
						<div>
							<div className="mb-3 flex flex-wrap items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
								<button className="hover:underline" onClick={() => setCurrentFolderId(null)}>
									Raiz
								</button>
								{currentFolderId != null && (
									<span>/ {folders.find((f) => f.id === currentFolderId)?.name}</span>
								)}
							</div>

							{subFolders.length > 0 && (
								<div className="mb-3 grid grid-cols-4 gap-2">
									{subFolders.map((folder) => (
										<button
											type="button"
											key={folder.id}
											className="flex flex-col items-center rounded border border-gray-200 p-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
											onClick={() => setCurrentFolderId(folder.id)}
										>
											<span className="text-xl">📁</span>
											<span className="mt-1 max-w-full truncate">{folder.name}</span>
										</button>
									))}
								</div>
							)}

							{loading ? (
								<p className="text-sm text-gray-500">Carregando...</p>
							) : items.length === 0 ? (
								<p className="text-sm text-gray-500">Nenhuma imagem nesta pasta.</p>
							) : (
								<div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto">
									{items.map((item) => (
										<button
											type="button"
											key={item.id}
											className="overflow-hidden rounded border border-gray-200 hover:ring-2 hover:ring-blue-500 dark:border-gray-700"
											onClick={() => select(item.url)}
											title={item.name}
										>
											<img src={item.url} alt={item.name} className="h-16 w-full object-cover" />
										</button>
									))}
								</div>
							)}
						</div>
					)}

					{tab === "upload" && (
						<div className="grid gap-3">
							<p className="text-sm text-gray-600 dark:text-gray-300">
								O ficheiro será guardado na pasta atual da Media Library
								{currentFolderId != null ? ` (${folders.find((f) => f.id === currentFolderId)?.name})` : " (Raiz)"}.
							</p>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								disabled={uploading}
								onChange={(e) => handleUpload(e.target.files)}
								className="text-sm"
							/>
							{uploading && <p className="text-sm text-gray-500">A enviar...</p>}
						</div>
					)}
				</Modal>
			)}
		</div>
	);
}
