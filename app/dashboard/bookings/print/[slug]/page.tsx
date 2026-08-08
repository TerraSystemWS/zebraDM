"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Booking, bookingsService } from "@/services/bookingsService";
import { Excursao, excursoesService } from "@/services/excursoesService";
import { Printer } from "lucide-react";

export default function PrintExcursionBookingsPage() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const [excursion, setExcursion] = useState<Excursao | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        (async () => {
            try {
                const [excursionData, bookingsData] = await Promise.all([
                    excursoesService.getBySlug(slug),
                    bookingsService.getAll(),
                ]);
                setExcursion(excursionData);
                setBookings(bookingsData.filter((b) => b.excursionSlug === slug));
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    if (loading) {
        return <div className="p-6 text-gray-600 dark:text-gray-300">A carregar...</div>;
    }

    if (!excursion) {
        return <div className="p-6 text-gray-600 dark:text-gray-300">Excursão não encontrada.</div>;
    }

    const confirmed = bookings.filter((b) => b.status === "Confirmed");

    return (
        <div className="print-area mx-auto max-w-3xl bg-white p-6 text-gray-900 dark:bg-gray-800 dark:text-white print:bg-white print:p-0 print:text-black">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body, .print-area { background: white !important; color: black !important; }
                    main { padding: 0 !important; }
                }
            `}</style>

            <div className="no-print mb-6 flex justify-end">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                    <Printer size={16} /> Imprimir
                </button>
            </div>

            <h1 className="text-2xl font-bold">{excursion.title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 print:text-black">
                {excursion.location} · {excursion.duration} · €{excursion.price}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 print:text-black">
                {excursion.groupTravelStatus === "CONFIRMED"
                    ? `Data confirmada: ${excursion.groupTravelConfirmedDate}`
                    : "Ainda sem data confirmada"}
            </p>

            <h2 className="mt-6 text-lg font-semibold">Pessoas confirmadas ({confirmed.length})</h2>
            <table className="mt-2 min-w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b-2 border-gray-300">
                        <th className="py-2 text-left">Cliente</th>
                        <th className="py-2 text-left">Email</th>
                        <th className="py-2 text-left">Data preferida</th>
                    </tr>
                </thead>
                <tbody>
                    {confirmed.map((b) => (
                        <tr key={b.id} className="border-b border-gray-200">
                            <td className="py-2">{b.user}</td>
                            <td className="py-2">{b.userEmail ?? "—"}</td>
                            <td className="py-2">{b.date}</td>
                        </tr>
                    ))}
                    {confirmed.length === 0 && (
                        <tr>
                            <td colSpan={3} className="py-4 text-gray-500 print:text-black">
                                Ainda não há reservas confirmadas para esta excursão.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
