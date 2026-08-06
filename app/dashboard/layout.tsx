"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, logout } from "@/lib/auth";
import { getUser } from "@/lib/api";
import {
	BedDouble,
	CalendarCheck,
	CalendarDays,
	Compass,
	FileEdit,
	FolderOpen,
	Image as ImageIcon,
	LayoutDashboard,
	LogOut,
	MapPin,
	Menu,
	Newspaper,
	Settings,
	Settings2,
	ShoppingBag,
	Sparkles,
	Users,
	X,
	type LucideIcon,
} from "lucide-react";

interface NavLinkItem {
	label: string;
	href: string;
	icon: LucideIcon;
}

function isActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ label, href, icon: Icon }: NavLinkItem) {
	const pathname = usePathname();
	const active = isActive(pathname, href);
	return (
		<Link
			href={href}
			className={`mx-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
				active
					? "bg-blue-600 font-medium text-white shadow-sm dark:bg-blue-500"
					: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
			}`}
		>
			<Icon className="shrink-0" size={18} />
			<span>{label}</span>
		</Link>
	);
}

function NavGroup({ title, items }: { title: string; items: NavLinkItem[] }) {
	return (
		<div className="mb-1">
			<p className="px-6 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
				{title}
			</p>
			<div className="flex flex-col gap-0.5">
				{items.map((item) => (
					<NavLink key={item.href} {...item} />
				))}
			</div>
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
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm">
							<Compass size={20} />
						</div>
						<div>
							<h1 className="text-xl font-bold leading-tight text-gray-800 dark:text-white">
								ZebraDash
							</h1>
							<p className="text-xs text-gray-500 dark:text-gray-400">Painel Admin</p>
						</div>
					</div>
					<button
						className="text-gray-500 focus:outline-none md:hidden"
						onClick={() => setSidebarOpen(false)}
						aria-label="Fechar menu"
					>
						<X size={22} />
					</button>
				</div>

				<nav className="flex-1 overflow-y-auto pb-6">
					<div className="flex flex-col gap-0.5">
						<NavLink label="Visão Geral" href="/dashboard" icon={LayoutDashboard} />
						<NavLink label="Destinos" href="/dashboard/destinos" icon={MapPin} />
					</div>

					<NavGroup
						title="Excursões"
						items={[
							{ label: "Gerenciar Excursões", href: "/dashboard/excursoes", icon: Compass },
							{ label: "Reservas (Excursões)", href: "/dashboard/bookings", icon: CalendarCheck },
						]}
					/>

					<NavGroup
						title="Hotel"
						items={[
							{ label: "Calendário", href: "/dashboard/hotel/calendario", icon: CalendarDays },
							{ label: "Reservas de Quarto", href: "/dashboard/hotel/reservas", icon: BedDouble },
							{ label: "Editar/Configurar", href: "/dashboard/hotel/configurar", icon: Settings2 },
							{ label: "Comodidades", href: "/dashboard/hotel/comodidades", icon: Sparkles },
						]}
					/>

					<NavGroup
						title="Conteúdo"
						items={[
							{ label: "Blog (Posts)", href: "/dashboard/posts", icon: Newspaper },
							{ label: "Galeria", href: "/dashboard/galeria", icon: ImageIcon },
						]}
					/>

					<NavGroup
						title="Loja"
						items={[
							{ label: "Produtos e Estoque", href: "/dashboard/loja", icon: ShoppingBag },
						]}
					/>

					<NavGroup
						title="Ficheiros"
						items={[
							{ label: "Media Library", href: "/dashboard/media", icon: FolderOpen },
						]}
					/>

					{isAdmin && (
						<NavGroup
							title="Administração"
							items={[
								{ label: "Usuários", href: "/dashboard/users", icon: Users },
								{ label: "Configurações", href: "/dashboard/settings", icon: Settings },
								{ label: "Editor de Conteúdo", href: "/dashboard/content", icon: FileEdit },
							]}
						/>
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
						<Menu size={24} />
					</button>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
								{(getUser()?.fullName ?? "A").charAt(0).toUpperCase()}
							</div>
							<span className="hidden font-medium text-gray-700 dark:text-gray-200 sm:inline">
								{getUser()?.fullName ?? "TerraSystem Admin"}
							</span>
						</div>
						<button
							onClick={handleLogout}
							className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600"
						>
							<LogOut size={15} />
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
