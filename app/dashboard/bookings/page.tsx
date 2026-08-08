"use client";

import { useEffect, useMemo, useState } from "react";
import { Booking, bookingsService } from "@/services/bookingsService";
import { Excursao, excursoesService } from "@/services/excursoesService";
import { Printer, ChevronDown, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";

interface ExcursionGroup {
    slug: string;
    title: string;
    price: number;
    groupTravelStatus: Excursao["groupTravelStatus"];
    groupTravelConfirmedDate: string | null;
    bookings: Booking[];
}

const GROUP_STATUS_LABEL: Record<Excursao["groupTravelStatus"], string> = {
    NONE: "Sem reservas",
    OPEN: "Aberta",
    CONFIRMED: "Confirmada",
    COMPLETED: "Terminada",
};

const GROUP_STATUS_CLASS: Record<Excursao["groupTravelStatus"], string> = {
    NONE: "bg-gray-200 text-gray-700",
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
    const [excursions, setExcursions] = useState<Excursao[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [showCompleted, setShowCompleted] = useState(false);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [bookingsData, excursoesData] = await Promise.all([
                bookingsService.getAll(),
                excursoesService.getAll(true),
            ]);
            setBookings(bookingsData);
            setExcursions(excursoesData);
        } catch (error) {
            console.error("Error loading bookings:", error);
            Swal.fire("Erro", "Erro ao carregar reservas", "error");
        } finally {
            setLoading(false);
        }
    };

    const groups = useMemo<ExcursionGroup[]>(() => {
        const bySlug = new Map<string, Booking[]>();
        for (const booking of bookings) {
            if (booking.type !== "EXCURSION" || !booking.excursionSlug) continue;
            const list = bySlug.get(booking.excursionSlug) ?? [];
            list.push(booking);
            bySlug.set(booking.excursionSlug, list);
        }
        return Array.from(bySlug.entries())
            .map(([slug, list]) => {
                const excursion = excursions.find((e) => e.slug === slug);
                if (!excursion) return null;
                return {
                    slug,
                    title: excursion.title,
                    price: excursion.price,
                    groupTravelStatus: excursion.groupTravelStatus,
                    groupTravelConfirmedDate: excursion.groupTravelConfirmedDate,
                    bookings: list,
                };
            })
            .filter((group): group is ExcursionGroup => group !== null);
    }, [bookings, excursions]);

    // Excursões terminadas (grupo travel concluído) saem da lista principal e só
    // aparecem numa secção à parte, escondida por padrão — mesmo padrão das
    // "Reservas Concluídas" do Hotel (ver dashboard/hotel/reservas/page.tsx).
    const activeGroups = useMemo(
        () => groups.filter((g) => g.groupTravelStatus !== "COMPLETED"),
        [groups]
    );
    const completedGroups = useMemo(
        () => groups.filter((g) => g.groupTravelStatus === "COMPLETED"),
        [groups]
    );

    const toggleExpanded = (slug: string) => {
        setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
    };

    const handleConfirmDate = async (group: ExcursionGroup) => {
        const { value: confirmedDate } = await Swal.fire({
            title: `Confirmar data final — ${group.title}`,
            html:
                '<label for="swal-confirm-date" style="display:block;font-size:13px;color:#666;margin-bottom:6px;text-align:left;">Data final (AAAA-MM-DD)</label>' +
                `<input type="date" id="swal-confirm-date" class="swal2-input" style="margin:0;width:100%;" value="${group.groupTravelConfirmedDate ?? ""}" />`,
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
            await excursoesService.confirmGroupTravel(group.slug, confirmedDate);
            Swal.fire("Confirmado!", "A excursão foi confirmada e já aparece na home.", "success");
            loadAll();
        } catch (error) {
            console.error("Error confirming group travel:", error);
            Swal.fire("Erro", "Não foi possível confirmar a data.", "error");
        }
    };

    const handleReopen = async (group: ExcursionGroup) => {
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
            await excursoesService.reopenGroupTravel(group.slug);
            Swal.fire("Reaberta!", "", "success");
            loadAll();
        } catch (error) {
            console.error("Error reopening group travel:", error);
            Swal.fire("Erro", "Não foi possível reabrir.", "error");
        }
    };

    const handleComplete = async (group: ExcursionGroup) => {
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
            await excursoesService.completeGroupTravel(group.slug);
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
            </div>

            {activeGroups.length === 0 && (
                <div className="rounded-lg bg-white p-6 text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
                    Ainda não há reservas de excursões.
                </div>
            )}

            <div className="flex flex-col gap-4">
                {activeGroups.map((group) => (
                    <div key={group.slug} className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <button
                                className="flex items-center gap-2 text-left"
                                onClick={() => toggleExpanded(group.slug)}
                            >
                                {expanded[group.slug] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{group.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {group.bookings.length} reserva(s) · €{group.price}
                                    </p>
                                </div>
                            </button>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${GROUP_STATUS_CLASS[group.groupTravelStatus]}`}>
                                    {GROUP_STATUS_LABEL[group.groupTravelStatus]}
                                    {group.groupTravelConfirmedDate ? ` — ${group.groupTravelConfirmedDate}` : ""}
                                </span>
                                {group.groupTravelStatus === "CONFIRMED" ? (
                                    <>
                                        {isPastDate(group.groupTravelConfirmedDate) && (
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
                                    href={`/dashboard/bookings/print/${group.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                                >
                                    <Printer size={15} /> Imprimir
                                </a>
                            </div>
                        </div>

                        {expanded[group.slug] && (
                            <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-700">
                                <table className="min-w-full leading-normal">
                                    <thead>
                                        <tr>
                                            {["Cliente", "Email", "Data preferida", "Status", "Valor"].map((h) => (
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
                        <div key={group.slug} className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{group.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {group.bookings.length} reserva(s) · €{group.price}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${GROUP_STATUS_CLASS[group.groupTravelStatus]}`}>
                                        {GROUP_STATUS_LABEL[group.groupTravelStatus]}
                                        {group.groupTravelConfirmedDate ? ` — ${group.groupTravelConfirmedDate}` : ""}
                                    </span>
                                    <a
                                        href={`/dashboard/bookings/print/${group.slug}`}
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
