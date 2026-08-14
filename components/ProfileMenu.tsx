"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { getUser } from "@/lib/api";

export default function ProfileMenu({ onLogout }: { onLogout: () => void }) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const user = getUser();

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="relative" ref={containerRef}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
				aria-haspopup="menu"
				aria-expanded={open}
			>
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
					{(user?.fullName ?? "A").charAt(0).toUpperCase()}
				</div>
				<span className="hidden font-medium text-gray-700 dark:text-gray-200 sm:inline">
					{user?.fullName ?? "TerraSystem Admin"}
				</span>
				<ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
			</button>

			{open && (
				<div
					role="menu"
					className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
				>
					<Link
						href="/dashboard/conta"
						role="menuitem"
						className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
						onClick={() => setOpen(false)}
					>
						<UserCircle size={16} />
						Minha Conta
					</Link>
					<button
						type="button"
						role="menuitem"
						onClick={onLogout}
						className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<LogOut size={16} />
						Sair
					</button>
				</div>
			)}
		</div>
	);
}
