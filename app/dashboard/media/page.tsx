"use client";

import { useEffect, useRef, useState } from "react";
import { MediaFolder, MediaItem, mediaService } from "@/services/mediaService";
import Swal from "sweetalert2";

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
	const [folders, setFolders] = useState<MediaFolder[]>([]);
	const [items, setItems] = useState<MediaItem[]>([]);
	const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		loadFolders();
	}, []);

	useEffect(() => {
		loadItems(currentFolderId);
	}, [currentFolderId]);

	const loadFolders = async () => {
		try {
			const data = await mediaService.getFolders();
			setFolders(data);
		} catch (error) {
			console.error("Error loading folders:", error);
			Swal.fire("Erro", "Erro ao carregar pastas", "error");
		}
	};

	const loadItems = async (folderId: number | null) => {
		setLoading(true);
		try {
			const data = await mediaService.getItems(folderId);
			setItems(data);
		} catch (error) {
			console.error("Error loading items:", error);
			Swal.fire("Erro", "Erro ao carregar ficheiros", "error");
		} finally {
			setLoading(false);
		}
	};

	const subFolders = folders.filter((f) => f.parentId === currentFolderId);

	const breadcrumb: MediaFolder[] = [];
	{
		let cursor = currentFolderId;
		while (cursor != null) {
			const folder = folders.find((f) => f.id === cursor);
			if (!folder) break;
			breadcrumb.unshift(folder);
			cursor = folder.parentId;
		}
	}

	const handleCreateFolder = async () => {
		const { value: name } = await Swal.fire({
			title: "Nova Pasta",
			input: "text",
			inputLabel: "Nome da pasta",
			showCancelButton: true,
			confirmButtonText: "Criar",
			cancelButtonText: "Cancelar",
		});
		if (name) {
			try {
				await mediaService.createFolder(name, currentFolderId);
				await loadFolders();
				Swal.fire("Sucesso", "Pasta criada.", "success");
			} catch (error) {
				console.error("Error creating folder:", error);
				Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível criar a pasta", "error");
			}
		}
	};

	const handleDeleteFolder = async (folder: MediaFolder) => {
		const result = await Swal.fire({
			title: `Apagar "${folder.name}"?`,
			text: "Os ficheiros dentro desta pasta serão movidos para a raiz.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "Sim, apagar!",
		});
		if (result.isConfirmed) {
			try {
				await mediaService.deleteFolder(folder.id);
				await loadFolders();
				Swal.fire("Apagada!", "A pasta foi apagada.", "success");
			} catch (error) {
				console.error("Error deleting folder:", error);
				Swal.fire("Erro", "Não foi possível apagar a pasta", "error");
			}
		}
	};

	const handleDeleteItem = async (item: MediaItem) => {
		const result = await Swal.fire({
			title: "Apagar este ficheiro?",
			text: item.name,
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "Sim, apagar!",
		});
		if (result.isConfirmed) {
			try {
				await mediaService.deleteItem(item.id);
				setItems(items.filter((i) => i.id !== item.id));
				Swal.fire("Apagado!", "O ficheiro foi apagado.", "success");
			} catch (error) {
				console.error("Error deleting item:", error);
				Swal.fire("Erro", "Não foi possível apagar o ficheiro", "error");
			}
		}
	};

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setUploading(true);
		try {
			for (const file of Array.from(files)) {
				await mediaService.upload(file, currentFolderId);
			}
			await loadItems(currentFolderId);
		} catch (error) {
			console.error("Error uploading file:", error);
			Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível enviar o ficheiro", "error");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const copyUrl = (url: string) => {
		navigator.clipboard.writeText(url);
		Swal.fire({ toast: true, position: "top-end", icon: "success", title: "URL copiado", showConfirmButton: false, timer: 1200 });
	};

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Media Library</h1>
				<div className="flex flex-wrap gap-2">
					<button
						className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
						onClick={handleCreateFolder}
					>
						Nova Pasta
					</button>
					<button
						className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={uploading}
						onClick={() => fileInputRef.current?.click()}
					>
						{uploading ? "A enviar..." : "Carregar do PC"}
					</button>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/*"
						className="hidden"
						onChange={(e) => handleUpload(e.target.files)}
					/>
				</div>
			</div>

			{/* Breadcrumb */}
			<div className="mb-4 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
				<button className="hover:underline" onClick={() => setCurrentFolderId(null)}>
					Raiz
				</button>
				{breadcrumb.map((folder) => (
					<span key={folder.id} className="flex items-center gap-1">
						<span>/</span>
						<button className="hover:underline" onClick={() => setCurrentFolderId(folder.id)}>
							{folder.name}
						</button>
					</span>
				))}
			</div>

			{/* Subfolders */}
			{subFolders.length > 0 && (
				<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{subFolders.map((folder) => (
						<div
							key={folder.id}
							className="group relative flex cursor-pointer flex-col items-center rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
							onClick={() => setCurrentFolderId(folder.id)}
						>
							<span className="text-3xl">📁</span>
							<span className="mt-2 max-w-full truncate text-sm text-gray-700 dark:text-gray-200">{folder.name}</span>
							<button
								className="absolute right-1 top-1 hidden text-xs text-red-500 hover:text-red-700 group-hover:block"
								onClick={(e) => {
									e.stopPropagation();
									handleDeleteFolder(folder);
								}}
							>
								✕
							</button>
						</div>
					))}
				</div>
			)}

			{/* Items */}
			{loading ? (
				<div className="text-gray-600 dark:text-gray-300">Carregando...</div>
			) : items.length === 0 ? (
				<div className="text-gray-500 dark:text-gray-400">Nenhum ficheiro nesta pasta.</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{items.map((item) => (
						<div
							key={item.id}
							className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
						>
							<div className="flex h-28 items-center justify-center bg-gray-100 dark:bg-gray-900">
								<img src={item.url} alt={item.name} className="h-full w-full object-cover" />
							</div>
							<div className="p-2">
								<p className="truncate text-xs text-gray-700 dark:text-gray-200" title={item.name}>
									{item.name}
								</p>
								<p className="text-xs text-gray-400">{formatSize(item.sizeBytes)}</p>
							</div>
							<div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
								<button
									className="rounded bg-white/90 px-1 text-xs text-gray-700 hover:bg-white"
									onClick={() => copyUrl(item.url)}
									title="Copiar URL"
								>
									🔗
								</button>
								<button
									className="rounded bg-white/90 px-1 text-xs text-red-600 hover:bg-white"
									onClick={() => handleDeleteItem(item)}
									title="Apagar"
								>
									✕
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
