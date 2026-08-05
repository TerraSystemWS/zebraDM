"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, logout } from "@/lib/auth";
import { getUser } from "@/lib/api";

interface NavLinkItem {
	label: string;
	href: string;
}

function isActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ label, href }: NavLinkItem) {
	const pathname = usePathname();
	const active = isActive(pathname, href);
	return (
		<Link
			href={href}
			className={`block px-6 py-2 text-sm transition-colors ${
				active
					? "border-r-2 border-blue-600 bg-blue-50 font-medium text-blue-700 dark:border-blue-400 dark:bg-gray-700 dark:text-white"
					: "text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
			}`}
		>
			{label}
		</Link>
	);
}

function NavGroup({ title, items }: { title: string; items: NavLinkItem[] }) {
	return (
		<div>
			<p className="px-6 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
				{title}
			</p>
			{items.map((item) => (
				<NavLink key={item.href} {...item} />
			))}
		</div>
	);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const isAdmin = getUser()?.role === "ADMIN";

	useEffect(() => {
		if (!isAuthenticated()) {
			router.push("/login");
		} else {
			setIsLoading(false);
		}
	}, [router]);

	useEffect(() => {
		setSidebarOpen(false);
	}, [pathname]);

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	if (isLoading) {
		return <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">Verificando autenticação...</div>;
	}

	return (
		<div className="flex h-screen bg-gray-100 dark:bg-gray-900">
			{/* Mobile backdrop */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/50 md:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-white shadow-md transition-transform duration-200 ease-in-out dark:bg-gray-800 md:static md:z-auto md:flex md:translate-x-0 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex shrink-0 items-center justify-between p-6">
					<div>
						<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
							ZebraDash
						</h1>
						<p className="text-sm text-gray-500 dark:text-gray-400">Dashboard</p>
					</div>
					<button
						className="text-gray-500 focus:outline-none md:hidden"
						onClick={() => setSidebarOpen(false)}
						aria-label="Fechar menu"
					>
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<nav className="flex-1 overflow-y-auto pb-6">
					<NavLink label="Visão Geral" href="/dashboard" />
					<NavLink label="Destinos" href="/dashboard/destinos" />

					<div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
					<NavGroup
						title="Excursões"
						items={[
							{ label: "Gerenciar Excursões", href: "/dashboard/excursoes" },
							{ label: "Reservas (Excursões)", href: "/dashboard/bookings" },
						]}
					/>

					<div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
					<NavGroup
						title="Hotel"
						items={[
							{ label: "Calendário", href: "/dashboard/hotel/calendario" },
							{ label: "Reservas de Quarto", href: "/dashboard/hotel/reservas" },
							{ label: "Editar/Configurar", href: "/dashboard/hotel/configurar" },
							{ label: "Comodidades", href: "/dashboard/hotel/comodidades" },
						]}
					/>

					<div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
					<NavLink label="Blog (Posts)" href="/dashboard/posts" />
					<NavLink label="Galeria" href="/dashboard/galeria" />

					<div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
					<NavGroup
						title="Loja"
						items={[
							{ label: "Produtos e Estoque", href: "/dashboard/loja" },
						]}
					/>

					<div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
					<NavLink label="Media Library" href="/dashboard/media" />

					{isAdmin && (
						<>
							<div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
							<NavLink label="Usuários" href="/dashboard/users" />
							<NavLink label="Configurações" href="/dashboard/settings" />
							<NavLink label="Editor de Conteúdo" href="/dashboard/content" />
						</>
					)}
				</nav>
			</aside>

			{/* Main Content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Topbar */}
				<header className="flex items-center justify-between bg-white px-6 py-4 shadow dark:bg-gray-800">
					<button
						className="text-gray-500 focus:outline-none md:hidden"
						onClick={() => setSidebarOpen(true)}
						aria-label="Abrir menu"
					>
						{/* Mobile Menu Button Icon */}
						<svg
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
					<div className="flex items-center gap-4">
						<span className="text-gray-700 dark:text-gray-200 font-medium">TerraSystem Admin</span>
						<button
							onClick={handleLogout}
							className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
						>
							Sair
						</button>
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 dark:bg-gray-900">
					{children}
				</main>
			</div>
		</div>
	);
}
