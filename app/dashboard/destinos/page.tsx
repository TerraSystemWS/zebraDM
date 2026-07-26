
"use client";

import { useEffect, useState } from "react";
import { Tour, destinosService } from "@/services/destinosService";
import Modal from "@/components/Modal";
import ImagePicker from "@/components/ImagePicker";
import Swal from "sweetalert2";
import { getUser } from "@/lib/api";

const emptyForm = { title: "", image: "", images: [] as string[], price: 0, description: "", tours: 0, category: "" };

export default function DestinosPage() {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<Tour | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const currentUser = getUser();
    const canDelete = (createdById?: number | null) =>
        currentUser?.role !== "AGENTE" || createdById === currentUser.id;

    useEffect(() => {
        loadTours();
    }, []);

    const loadTours = async () => {
        setLoading(true);
        try {
            const data = await destinosService.getAll();
            setTours(data);
        } catch (error) {
            console.error("Error loading tours:", error);
            Swal.fire("Erro", "Erro ao carregar destinos", "error");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (tour: Tour) => {
        setEditing(tour);
        setForm({
            title: tour.title,
            image: tour.image,
            images: tour.images || [],
            price: tour.price,
            description: tour.description,
            tours: tour.tours,
            category: tour.category.join(", "),
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            title: form.title,
            image: form.image,
            images: form.images,
            price: Number(form.price),
            description: form.description,
            tours: Number(form.tours),
            category: form.category.split(",").map((c) => c.trim()).filter(Boolean),
        };
        try {
            if (editing) {
                await destinosService.update(editing.id, payload);
            } else {
                await destinosService.create(payload);
            }
            setShowForm(false);
            await loadTours();
            Swal.fire("Sucesso", editing ? "Destino atualizado." : "Destino criado.", "success");
        } catch (error) {
            console.error("Error saving tour:", error);
            Swal.fire("Erro", "Não foi possível guardar o destino", "error");
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
                await destinosService.delete(id);
                setTours(tours.filter((t) => t.id !== id));
                Swal.fire("Deletado!", "O destino foi deletado.", "success");
            } catch (error) {
                console.error("Error deleting tour:", error);
                Swal.fire("Erro", "Erro ao deletar destino", "error");
            }
        }
    };

    if (loading) {
        return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando destinos...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Gestão de Destinos
                </h1>
                <button
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    onClick={openCreate}
                >
                    Novo Destino
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Imagem
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Título
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Categoria
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Tours
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tours.map((tour) => (
                            <tr key={tour.id}>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="h-10 w-10 flex-shrink-0">
                                        <img
                                            className="h-full w-full rounded-full object-cover"
                                            src={tour.image}
                                            alt={tour.title}
                                        />
                                    </div>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        {tour.title}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        {tour.category.join(", ")}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        {tour.tours}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex gap-2">
                                        <button
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            onClick={() => openEdit(tour)}
                                        >
                                            Editar
                                        </button>
                                        {canDelete(tour.createdById) && (
                                            <button
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                onClick={() => handleDelete(tour.id)}
                                            >
                                                Deletar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title={editing ? "Editar Destino" : "Novo Destino"} onClose={() => setShowForm(false)}>
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
                        <ImagePicker
                            label="Imagem"
                            value={form.image}
                            onChange={(url) => setForm({ ...form, image: url })}
                        />
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Galeria de Fotos</label>
                            {form.images.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-2">
                                    {form.images.map((url, idx) => (
                                        <div key={idx} className="relative">
                                            <img src={url} alt="" className="h-16 w-16 rounded object-cover border border-gray-300 dark:border-gray-600" />
                                            <button
                                                type="button"
                                                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                                                onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
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
                                onChange={(url) => setForm({ ...form, images: [...form.images, url] })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Preço (por viagem)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Categorias (separadas por vírgula)</label>
                            <input
                                className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="asia, india"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Número de Tours</label>
                            <input
                                type="number"
                                required
                                className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={form.tours}
                                onChange={(e) => setForm({ ...form, tours: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Descrição</label>
                            <textarea
                                required
                                rows={3}
                                className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
