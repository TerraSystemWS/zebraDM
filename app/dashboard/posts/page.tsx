
"use client";

import { useEffect, useState } from "react";
import { Post, PostInput, postsService } from "@/services/postsService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import Swal from "sweetalert2";
import { getUser } from "@/lib/api";

const emptyForm: PostInput = { title: "", author: "", image: "", content: "", category: "", description: "" };

export default function PostsPage() {
	const [blogPosts, setBlogPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState<Post | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<PostInput>(emptyForm);
	const [showArchived, setShowArchived] = useState(false);
	const currentUser = getUser();
	const canManage = (createdById?: number | null) =>
		currentUser?.role !== "AGENTE" || createdById === currentUser.id;

	useEffect(() => {
		loadPosts();
	}, [showArchived]);

	const loadPosts = async () => {
		setLoading(true);
		try {
			const data = await postsService.getAll(showArchived);
			setBlogPosts(data);
		} catch (error) {
			console.error("Error loading posts:", error);
			Swal.fire("Erro", "Erro ao carregar posts", "error");
		} finally {
			setLoading(false);
		}
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setShowForm(true);
	};

	const openEdit = (post: Post) => {
		setEditing(post);
		setForm({
			title: post.title,
			author: post.author,
			date: post.date,
			image: post.image,
			content: post.content,
			category: post.category,
			description: post.description,
			slug: post.slug,
		});
		setShowForm(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			if (editing) {
				await postsService.update(editing.id, form);
			} else {
				await postsService.create(form);
			}
			setShowForm(false);
			await loadPosts();
			Swal.fire("Sucesso", editing ? "Post atualizado." : "Post criado.", "success");
		} catch (error) {
			console.error("Error saving post:", error);
			Swal.fire("Erro", "Não foi possível guardar o post", "error");
		} finally {
			setSaving(false);
		}
	};

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Tem certeza?",
            text: "Você não poderá reverter isso!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, deletar!",
        });

        if (result.isConfirmed) {
            try {
                await postsService.delete(id);
                setBlogPosts(blogPosts.filter((p) => p.id !== id));
                Swal.fire("Deletado!", "O post foi deletado.", "success");
            } catch (error) {
                console.error("Error deleting post:", error);
                Swal.fire("Erro", "Erro ao deletar post", "error");
            }
        }
    };

    const handleArchive = async (id: number) => {
        try {
            await postsService.archive(id);
            await loadPosts();
            Swal.fire("Arquivado!", "O post foi arquivado.", "success");
        } catch (error) {
            console.error("Error archiving post:", error);
            Swal.fire("Erro", "Erro ao arquivar post", "error");
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await postsService.restore(id);
            await loadPosts();
            Swal.fire("Restaurado!", "O post foi restaurado.", "success");
        } catch (error) {
            console.error("Error restoring post:", error);
            Swal.fire("Erro", "Erro ao restaurar post", "error");
        }
    };

	if (loading) {
		return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando posts...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
					Gestão de Posts (Blog)
				</h1>
				<div className="flex flex-wrap items-center gap-4">
					<label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
						<input
							type="checkbox"
							checked={showArchived}
							onChange={(e) => setShowArchived(e.target.checked)}
						/>
						Mostrar arquivados
					</label>
					<button
						className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
						onClick={openCreate}
					>
						Novo Post
					</button>
				</div>
			</div>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="min-w-full leading-normal">
					<thead>
						<tr>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Título
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Autor
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Data
							</th>
							<th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Categoria
							</th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
								Ações
							</th>
						</tr>
					</thead>
					<tbody>
						{blogPosts.map((post) => (
							<tr key={post.id}>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                                            <img className="h-full w-full rounded-full object-cover" src={post.image} alt="" />
                                        </div>
                                        <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                            {post.title}
                                            {post.status === "ARCHIVED" && (
                                                <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    Arquivado
                                                </span>
                                            )}
                                        </p>
                                    </div>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<p className="whitespace-no-wrap text-gray-900 dark:text-white">
										{post.author}
									</p>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<p className="whitespace-no-wrap text-gray-900 dark:text-white">
										{post.date}
									</p>
								</td>
								<td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<span className="relative inline-block px-3 py-1 font-semibold text-blue-900 leading-tight">
                                        <span aria-hidden className="absolute inset-0 bg-blue-200 opacity-50 rounded-full"></span>
                                        <span className="relative">{post.category}</span>
                                    </span>
								</td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
									<div className="flex gap-2">
										{canManage(post.createdById) && (
											<>
												<button
													className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
													onClick={() => openEdit(post)}
												>
													Editar
												</button>
												{post.status === "ARCHIVED" ? (
													<button
														className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
														onClick={() => handleRestore(post.id)}
													>
														Restaurar
													</button>
												) : (
													<button
														className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
														onClick={() => handleArchive(post.id)}
													>
														Arquivar
													</button>
												)}
												<button
													className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
													onClick={() => handleDelete(post.id)}
												>
													Deletar
												</button>
											</>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{showForm && (
				<Modal title={editing ? "Editar Post" : "Novo Post"} onClose={() => setShowForm(false)}>
					<form onSubmit={handleSubmit} className="grid gap-4">
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Título</label>
							<input
								required
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.title}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Autor</label>
								<input
									required
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.author}
									onChange={(e) => setForm({ ...form, author: e.target.value })}
								/>
							</div>
							<div>
								<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Categoria</label>
								<input
									required
									className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									value={form.category}
									onChange={(e) => setForm({ ...form, category: e.target.value })}
								/>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Data</label>
							<input
								type="date"
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.date ?? ""}
								onChange={(e) => setForm({ ...form, date: e.target.value })}
							/>
						</div>
						<ImagePicker
							label="Imagem"
							value={form.image}
							onChange={(url) => setForm({ ...form, image: url })}
						/>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Descrição (resumo)</label>
							<textarea
								required
								rows={2}
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Conteúdo</label>
							<textarea
								required
								rows={5}
								className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								value={form.content}
								onChange={(e) => setForm({ ...form, content: e.target.value })}
							/>
						</div>
						<button
							type="submit"
							disabled={saving}
							className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
						>
							{saving ? "A guardar..." : "Guardar"}
						</button>
					</form>
				</Modal>
			)}
		</div>
	);
}
