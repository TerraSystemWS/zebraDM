
"use client";

import { useEffect, useState } from "react";
import { User, UserInput, usersService } from "@/services/usersService";
import Modal from "@/components/Modal";
import Swal from "sweetalert2";

const emptyForm: UserInput = { name: "", email: "", password: "", role: "CLIENT", status: "Active" };

type Tab = "CLIENTS" | "STAFF";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<UserInput>(emptyForm);
    const [tab, setTab] = useState<Tab>("CLIENTS");

    const clients = users.filter((u) => u.role === "CLIENT");
    const staff = users.filter((u) => u.role === "ADMIN" || u.role === "AGENTE");
    const visibleUsers = tab === "CLIENTS" ? clients : staff;

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await usersService.getAll();
            setUsers(data);
        } catch (error) {
            console.error("Error loading users:", error);
            Swal.fire("Erro", "Erro ao carregar usuários", "error");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ ...emptyForm, role: tab === "STAFF" ? "AGENTE" : "CLIENT" });
        setShowForm(true);
    };

    const openEdit = (user: User) => {
        setEditing(user);
        setForm({ name: user.name, email: user.email, password: "", role: user.role, status: user.status });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                await usersService.update(editing.id, form);
            } else {
                await usersService.create(form);
            }
            setShowForm(false);
            await loadUsers();
            Swal.fire("Sucesso", editing ? "Usuário atualizado." : "Usuário criado.", "success");
        } catch (error) {
            console.error("Error saving user:", error);
            Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível guardar o usuário", "error");
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
                await usersService.delete(id);
                setUsers(users.filter((u) => u.id !== id));
                Swal.fire("Deletado!", "O usuário foi deletado.", "success");
            } catch (error) {
                console.error("Error deleting user:", error);
                Swal.fire("Erro", "Erro ao deletar usuário", "error");
            }
        }
    };

    if (loading) {
        return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando usuários...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Gestão de Usuários
                </h1>
                <button
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    onClick={openCreate}
                >
                    Novo Usuário
                </button>
            </div>

            <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === "CLIENTS"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setTab("CLIENTS")}
                >
                    Utilizadores / Clientes ({clients.length})
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === "STAFF"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setTab("STAFF")}
                >
                    ADM / Agentes ({staff.length})
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Nome
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Email
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Role
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Status
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="border-b border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                    Nenhum utilizador nesta categoria.
                                </td>
                            </tr>
                        )}
                        {visibleUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap font-medium text-gray-900 dark:text-white">
                                        {user.name}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        {user.email}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        {user.role}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${user.status === 'Active' ? 'text-green-900' : 'text-red-900'}`}>
                                        <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${user.status === 'Active' ? 'bg-green-200' : 'bg-red-200'}`}></span>
                                        <span className="relative">{user.status}</span>
                                    </span>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex gap-2">
                                        <button
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            onClick={() => openEdit(user)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            onClick={() => handleDelete(user.id)}
                                        >
                                            Deletar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title={editing ? "Editar Usuário" : "Novo Usuário"} onClose={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nome</label>
                            <input
                                required
                                className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                required
                                disabled={!!editing}
                                className="w-full rounded border px-3 py-2 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Senha {editing && "(deixar em branco para manter)"}
                            </label>
                            <input
                                type="password"
                                required={!editing}
                                minLength={6}
                                className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Role</label>
                                <select
                                    className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="CLIENT">Cliente</option>
                                    <option value="AGENTE">Agente de Viagem</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Status</label>
                                <select
                                    className="w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <option value="Active">Ativo</option>
                                    <option value="Inactive">Inativo</option>
                                </select>
                            </div>
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
