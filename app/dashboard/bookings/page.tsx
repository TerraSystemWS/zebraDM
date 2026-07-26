
"use client";

import { useEffect, useState } from "react";
import { Booking, bookingsService } from "@/services/bookingsService";
import Swal from "sweetalert2";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await bookingsService.getAll();
            setBookings(data);
        } catch (error) {
            console.error("Error loading bookings:", error);
            Swal.fire("Erro", "Erro ao carregar reservas", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number, currentStatus: string) => {
        const { value: status } = await Swal.fire({
            title: 'Alterar Status',
            input: 'select',
            inputOptions: {
                'Pending': 'Pendente',
                'Confirmed': 'Confirmado',
                'Cancelled': 'Cancelado'
            },
            inputPlaceholder: 'Selecione um status',
            inputValue: currentStatus,
            showCancelButton: true,
        });

        if (status) {
            try {
                await bookingsService.updateStatus(id, status);
                setBookings(bookings.map(b => b.id === id ? { ...b, status: status as any } : b));
                Swal.fire("Atualizado!", `Status alterado para ${status}.`, "success");
            } catch (error) {
                console.error("Error updating booking:", error);
                Swal.fire("Erro", "Erro ao atualizar reserva", "error");
            }
        }
    };

    if (loading) {
        return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando reservas...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Gestão de Excursões (Reservas)
                </h1>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                ID
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Usuário
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Tour
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Data
                            </th>
                            <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                Valor
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
                        {bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        #{booking.id}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        {booking.user}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        {booking.tour}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        {booking.date}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="whitespace-no-wrap text-gray-900 dark:text-white">
                                        ${booking.amount}
                                    </p>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight
                                        ${booking.status === 'Confirmed' ? 'text-green-900' :
                                            booking.status === 'Pending' ? 'text-yellow-900' : 'text-red-900'}`}>
                                        <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full
                                            ${booking.status === 'Confirmed' ? 'bg-green-200' :
                                                booking.status === 'Pending' ? 'bg-yellow-200' : 'bg-red-200'}`}></span>
                                        <span className="relative">{booking.status}</span>
                                    </span>
                                </td>
                                <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm dark:border-gray-700 dark:bg-gray-800">
                                    <button
                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                        onClick={() => handleStatusChange(booking.id, booking.status)}
                                    >
                                        Alterar Status
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
