"use client";

import { useEffect, useMemo, useState } from "react";
import { Booking, bookingsService } from "@/services/bookingsService";
import { ExcursionGroup, excursionGroupsService } from "@/services/excursionGroupsService";
import { Excursao, excursoesService } from "@/services/excursoesService";
import { Printer, ChevronDown, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";

interface GroupWithBookings extends ExcursionGroup {
    bookings: Booking[];
}

const GROUP_STATUS_LABEL: Record<ExcursionGroup["status"], string> = {
    OPEN: "Aberta",
    CONFIRMED: "Confirmada",
    COMPLETED: "Terminada",
};

const GROUP_STATUS_CLASS: Record<ExcursionGroup["status"], string> = {
    OPEN: "bg-yellow-200 text-yellow-900",
    CONFIRMED: "bg-green-200 text-green-900",
    COMPLETED: "bg-blue-200 text-blue-900",
};

function isPastDate(date: string | null): boolean {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${date}T00:00:00`) < today;
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [excursionGroups, setExcursionGroups] = useState<ExcursionGroup[]>([]);
    const [excursoes, setExcursoes] = useState<Excursao[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [showCompleted, setShowCompleted] = useState(false);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [bookingsData, groupsData, excursoesData] = await Promise.all([
                bookingsService.getAll(),
                excursionGroupsService.getAll(),
                excursoesService.getAll(),
            ]);
            setBookings(bookingsData);
            setExcursionGroups(groupsData);
            setExcursoes(excursoesData);
        } catch (error) {
            console.error("Error loading bookings:", error);
            Swal.fire("Erro", "Erro ao carregar reservas", "error");
        } finally {
            setLoading(false);
        }
    };

    // Campos do primeiro participante, sempre pedidos explicitamente aqui — nunca vêm do
    // admin/agente com sessão iniciada no dashboard, que só está a *criar* o grupo, não a
    // participar nele.
    const PARTICIPANT_FIELDS_HTML =
        '<input id="swal-guest-name" class="swal2-input" placeholder="Nome completo" style="margin:0 0 8px;">' +
        '<input id="swal-guest-email" class="swal2-input" placeholder="Email (opcional)" style="margin:0 0 8px;">' +
        '<input id="swal-guest-phone" class="swal2-input" placeholder="Telefone (opcional)" style="margin:0 0 8px;">' +
        '<label for="swal-guest-date" style="display:block;font-size:13px;color:#666;margin:6px 0 2px;text-align:left;">Data preferida</label>' +
        '<input id="swal-guest-date" type="date" class="swal2-input" style="margin:0 0 8px;">' +
        '<label for="swal-guest-status" style="display:block;font-size:13px;color:#666;margin:6px 0 2px;text-align:left;">Estado</label>' +
        '<select id="swal-guest-status" class="swal2-input" style="margin:0;">' +
        '<option value="PENDING">Pendente</option>' +
        '<option value="CONFIRMED">Confirmado (já pagou)</option>' +
        "</select>";

    function readParticipantFields() {
        const name = (document.getElementById("swal-guest-name") as HTMLInputElement)?.value?.trim();
        if (!name) {
            Swal.showValidationMessage("O nome é obrigatório");
            return false;
        }
        return {
            guestName: name,
            guestEmail: (document.getElementById("swal-guest-email") as HTMLInputElement)?.value || undefined,
            guestPhone: (document.getElementById("swal-guest-phone") as HTMLInputElement)?.value || undefined,
            date: (document.getElementById("swal-guest-date") as HTMLInputElement)?.value || undefined,
            status: (document.getElementById("swal-guest-status") as HTMLSelectElement)?.value || "PENDING",
        };
    }

    // Um grupo nunca fica vazio: criá-lo já pede os dados de quem vai ser o primeiro
    // participante, na mesma ação (em vez de abrir um grupo sem ninguém lá dentro).
    const handleCreateGroup = async () => {
        if (excursoes.length === 0) {
            Swal.fire("Erro", "Não há excursões disponíveis — cria uma primeiro em Editar/Configurar.", "error");
            return;
        }
        const excursionOptionsHtml = excursoes
            .map((ex) => `<option value="${ex.slug}">${ex.title}</option>`)
            .join("");
        const { value: formValues } = await Swal.fire({
            title: "Criar Grupo de Viagem",
            html:
                '<label for="swal-group-excursion" style="display:block;font-size:13px;color:#666;margin-bottom:2px;text-align:left;">Excursão</label>' +
                `<select id="swal-group-excursion" class="swal2-input" style="margin:0 0 12px;">${excursionOptionsHtml}</select>` +
                '<label style="display:block;font-size:13px;font-weight:600;color:#333;margin:4px 0 6px;text-align:left;">Primeiro participante</label>' +
                PARTICIPANT_FIELDS_HTML,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Criar",
            cancelButtonText: "Cancelar",
            preConfirm: () => {
                const participant = readParticipantFields();
                if (!participant) return false;
                const slug = (document.getElementById("swal-group-excursion") as HTMLSelectElement)?.value;
                return { slug, ...participant };
            },
        });
        if (!formValues) return;
        try {
            const { slug, ...participant } = formValues;
            const group = await excursionGroupsService.create(slug);
            await excursionGroupsService.addParticipant(group.id, participant);
            Swal.fire("Sucesso", "Grupo de viagem criado com o primeiro participante.", "success");
            loadAll();
        } catch (error) {
            console.error("Error creating group travel:", error);
            Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível criar o grupo.", "error");
        }
    };

    const handleAddParticipant = async (group: GroupWithBookings) => {
        const { value: formValues } = await Swal.fire({
            title: `Adicionar Participante — ${group.excursionTitle}`,
            html: PARTICIPANT_FIELDS_HTML,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Adicionar",
            cancelButtonText: "Cancelar",
            preConfirm: readParticipantFields,
        });
        if (!formValues) return;
        try {
            await excursionGroupsService.addParticipant(group.id, formValues);
            Swal.fire("Sucesso", "Participante adicionado.", "success");
            loadAll();
        } catch (error) {
            console.error("Error adding participant:", error);
            Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível adicionar o participante.", "error");
        }
    };

    const handleRemoveParticipant = async (group: GroupWithBookings, booking: Booking) => {
        const result = await Swal.fire({
            title: `Remover "${booking.user}" do grupo?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, remover",
            cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
        try {
            await excursionGroupsService.removeParticipant(group.id, booking.id);
            Swal.fire("Removido!", "", "success");
            loadAll();
        } catch (error) {
            console.error("Error removing participant:", error);
            Swal.fire("Erro", error instanceof Error ? error.message : "Não foi possível remover o participante.", "error");
        }
    };

    // Uma excursão pode ter mais do que um grupo de viagem ao longo do tempo —
    // depois de um grupo ser confirmado, a próxima reserva abre um novo em vez
    // de se juntar ao já confirmado (ver BookingController.create no backend).
    // Por isso agrupamos por excursionGroupId, não por excursionSlug.
    const groups = useMemo<GroupWithBookings[]>(() => {
        const byGroupId = new Map<number, Booking[]>();
        for (const booking of bookings) {
            if (booking.type !== "EXCURSION" || booking.excursionGroupId == null) continue;
            const list = byGroupId.get(booking.excursionGroupId) ?? [];
            list.push(booking);
            byGroupId.set(booking.excursionGroupId, list);
        }
        return excursionGroups.map((group) => ({
            ...group,
            bookings: byGroupId.get(group.id) ?? [],
        }));
    }, [bookings, excursionGroups]);

    // Grupos terminados saem da lista principal e só aparecem numa secção à
    // parte, escondida por padrão — mesmo padrão das "Reservas Concluídas" do
    // Hotel (ver dashboard/hotel/reservas/page.tsx).
    const activeGroups = useMemo(
        () => groups.filter((g) => g.status !== "COMPLETED"),
        [groups]
    );
    const completedGroups = useMemo(
        () => groups.filter((g) => g.status === "COMPLETED"),
        [groups]
    );

    const toggleExpanded = (id: number) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleConfirmDate = async (group: GroupWithBookings) => {
        const { value: confirmedDate } = await Swal.fire({
            title: `Confirmar data final — ${group.excursionTitle}`,
            html:
                '<label for="swal-confirm-date" style="display:block;font-size:13px;color:#666;margin-bottom:6px;text-align:left;">Data final (AAAA-MM-DD)</label>' +
                `<input type="date" id="swal-confirm-date" class="swal2-input" style="margin:0;width:100%;" value="${group.confirmedDate ?? ""}" />`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Confirmar",
            cancelButtonText: "Cancelar",
            preConfirm: () => {
                const input = document.getElementById("swal-confirm-date") as HTMLInputElement | null;
                if (!input || !input.value) {
                    Swal.showValidationMessage("Escolhe uma data");
                    return false;
                }
                return input.value;
            },
        });
        if (!confirmedDate) return;
        try {
            await excursionGroupsService.confirm(group.id, confirmedDate);
            Swal.fire("Confirmado!", "A excursão foi confirmada e já aparece na home.", "success");
            loadAll();
        } catch (error) {
            console.error("Error confirming group travel:", error);
            Swal.fire("Erro", "Não foi possível confirmar a data.", "error");
        }
    };

    const handleReopen = async (group: GroupWithBookings) => {
        const result = await Swal.fire({
            title: "Reabrir excursão?",
            text: "A excursão deixa de aparecer na secção de Grupo Travel da home.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, reabrir",
            cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
        try {
            await excursionGroupsService.reopen(group.id);
            Swal.fire("Reaberta!", "", "success");
            loadAll();
        } catch (error) {
            console.error("Error reopening group travel:", error);
            Swal.fire("Erro", "Não foi possível reabrir.", "error");
        }
    };

    const handleComplete = async (group: GroupWithBookings) => {
        const result = await Swal.fire({
            title: "Marcar excursão como terminada?",
            text: "A excursão passa para a secção de Concluídas e deixa de poder ser editada aqui.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sim, terminada",
            cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
        try {
            await excursionGroupsService.complete(group.id);
            Swal.fire("Concluída!", "", "success");
            loadAll();
        } catch (error) {
            console.error("Error completing group travel:", error);
            Swal.fire("Erro", "Não foi possível marcar como terminada.", "error");
        }
    };

    const handleStatusChange = async (booking: Booking) => {
        const { value: status } = await Swal.fire({
            title: "Alterar Status",
            input: "select",
            inputOptions: {
                Pending: "Pendente",
                Confirmed: "Confirmado",
                Cancelled: "Cancelado",
            },
            inputPlaceholder: "Selecione um status",
            inputValue: booking.status,
            showCancelButton: true,
        });
        if (!status) return;
        try {
            await bookingsService.updateStatus(booking.id, status);
            Swal.fire("Atualizado!", `Status alterado para ${status}.`, "success");
            loadAll();
        } catch (error) {
            console.error("Error updating booking:", error);
            Swal.fire("Erro", "Erro ao atualizar reserva", "error");
        }
    };

    if (loading) {
        return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando reservas...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Reservas (Excursões)
                </h1>
                <button
                    onClick={handleCreateGroup}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                    + Criar Grupo de Viagem
                </button>
            </div>

            {activeGroups.length === 0 && (
                <div className="rounded-lg bg-white p-6 text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
                    Ainda não há reservas de excursões.
                </div>
            )}

            <div className="flex flex-col gap-4">
                {activeGroups.map((group) => (
                    <div key={group.id} className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <button
                                className="flex items-center gap-2 text-left"
                                onClick={() => toggleExpanded(group.id)}
                            >
                                {expanded[group.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">
                                        {group.excursionTitle}
                                        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                                            grupo #{group.id} · desde {new Date(group.createdAt).toLocaleDateString()}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {group.bookings.length} reserva(s) · €{group.price}
                                    </p>
                                </div>
                            </button>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${GROUP_STATUS_CLASS[group.status]}`}>
                                    {GROUP_STATUS_LABEL[group.status]}
                                    {group.confirmedDate ? ` — ${group.confirmedDate}` : ""}
                                </span>
                                {group.status === "OPEN" && (
                                    <button
                                        onClick={() => handleAddParticipant(group)}
                                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                                    >
                                        + Participante
                                    </button>
                                )}
                                {group.status === "CONFIRMED" ? (
                                    <>
                                        {isPastDate(group.confirmedDate) && (
                                            <button
                                                onClick={() => handleComplete(group)}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                                            >
                                                Terminada
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleReopen(group)}
                                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                                        >
                                            Reabrir
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleConfirmDate(group)}
                                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                                    >
                                        Confirmar Data
                                    </button>
                                )}
                                <a
                                    href={`/dashboard/bookings/print/${group.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                                >
                                    <Printer size={15} /> Imprimir
                                </a>
                            </div>
                        </div>

                        {expanded[group.id] && (
                            <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-700">
                                <table className="min-w-full leading-normal">
                                    <thead>
                                        <tr>
                                            {["Cliente", "Email", "Data preferida", "Status", "Valor", "Ações"].map((h) => (
                                                <th
                                                    key={h}
                                                    className="border-b-2 border-gray-200 bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-300"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.bookings.map((booking) => (
                                            <tr key={booking.id}>
                                                <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:text-white">
                                                    {booking.user}
                                                </td>
                                                <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                                    {booking.userEmail ?? "—"}
                                                </td>
                                                <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:text-white">
                                                    {booking.date}
                                                </td>
                                                <td className="border-b border-gray-100 px-4 py-3 text-sm">
                                                    <button
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        onClick={() => handleStatusChange(booking)}
                                                    >
                                                        {booking.status}
                                                    </button>
                                                </td>
                                                <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                                    €{booking.amount}
                                                </td>
                                                <td className="border-b border-gray-100 px-4 py-3 text-sm dark:border-gray-700">
                                                    {booking.status === "Confirmed" ? (
                                                        <span className="text-xs text-gray-400" title="Já confirmado/pago — não pode ser removido">—</span>
                                                    ) : (
                                                        <button
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                                                            onClick={() => handleRemoveParticipant(group, booking)}
                                                        >
                                                            Remover
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <button
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => setShowCompleted((v) => !v)}
                >
                    {showCompleted ? "Ocultar" : "Mostrar"} excursões concluídas ({completedGroups.length})
                </button>
            </div>

            {showCompleted && (
                <div className="mt-4 flex flex-col gap-3">
                    {completedGroups.length === 0 && (
                        <div className="rounded-lg bg-white p-6 text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
                            Ainda não há excursões concluídas.
                        </div>
                    )}
                    {completedGroups.map((group) => (
                        <div key={group.id} className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">
                                        {group.excursionTitle}
                                        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                                            grupo #{group.id}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {group.bookings.length} reserva(s) · €{group.price}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${GROUP_STATUS_CLASS[group.status]}`}>
                                        {GROUP_STATUS_LABEL[group.status]}
                                        {group.confirmedDate ? ` — ${group.confirmedDate}` : ""}
                                    </span>
                                    <a
                                        href={`/dashboard/bookings/print/${group.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                                    >
                                        <Printer size={15} /> Imprimir
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
