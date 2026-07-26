
"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { settingsService } from "@/services/settingsService";

export default function SettingsPage() {
    const [maintenanceMode, setMaintenanceMode] = useState(0);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const mode = await settingsService.getMaintenanceMode();
        setMaintenanceMode(mode);
    };

    const handleMaintenanceToggle = async () => {
        try {
            const newMode = maintenanceMode === 1 ? 0 : 1;
            await settingsService.setMaintenanceMode(newMode);
            setMaintenanceMode(newMode);
            const statusText = newMode === 1 ? "Ativado" : "Desativado";
            Swal.fire("Sucesso", `Modo de Manutenção ${statusText}`, "success");
        } catch (error) {
            console.error("Error toggling maintenance mode:", error);
            Swal.fire("Erro", "Falha ao alterar modo de manutenção", "error");
        }
    };

    const handleSave = () => {
        Swal.fire("Sucesso", "Configurações salvas (Mock)", "success");
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
                Configurações
            </h1>

            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <div className="mb-4">
                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="siteName">
                        Nome do Site
                    </label>
                    <input
                        className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none dark:bg-gray-700 dark:text-white"
                        id="siteName"
                        type="text"
                        defaultValue="Zebra Travel"
                    />
                </div>

                <div className="mb-6">
                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="email">
                        Email de Contato
                    </label>
                    <input
                        className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none dark:bg-gray-700 dark:text-white"
                        id="email"
                        type="email"
                        defaultValue="contato@zebratravel.com"
                    />
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Modo de Manutenção</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ative para colocar o site público offline.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={maintenanceMode === 1}
                            onChange={handleMaintenanceToggle}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <button
                    className="focus:shadow-outline rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
                    type="button"
                    onClick={handleSave}
                >
                    Salvar Configurações
                </button>
            </div>
        </div>
    );
}
