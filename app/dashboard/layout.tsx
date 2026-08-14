"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, logout } from "@/lib/auth";
import { getUser } from "@/lib/api";
import { contactsService } from "@/services/contactsService";
import ProfileMenu from "@/components/ProfileMenu";
import NotificationBell from "@/components/NotificationBell";
import {
	BedDouble,
	CalendarCheck,
	CalendarDays,
	Compass,
	FileEdit,
	Briefcase,
	FolderOpen,
	Handshake,
	Image as ImageIcon,
	Inbox,
	LayoutDashboard,
	Mail,
	MapPin,
	Menu,
	Newspaper,
	Quote,
	Settings,
	Settings2,
	ShoppingBag,
	Sparkles,
	Megaphone,
	Receipt,
	Ticket,
	Truck,
	UserCog,
	Users,
	X,
	type LucideIcon,
} from "lucide-react";

interface NavLinkItem {
	label: string;
	href: string;
	icon: LucideIcon;
}

function matches(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(href + "/");
}

// Entre todos os hrefs do menu que "batem" com o pathname atual (por prefixo),
// só o mais específico (mais longo) deve ficar ativo — caso contrário, um item
// pai (ex: "/dashboard/loja") fica sempre destacado junto com o filho ativo
// (ex: "/dashboard/loja/encomendas"), e "/dashboard" (Visão Geral) ficaria
// destacado em todas as páginas do painel, já que é prefixo de todas.
function findActiveHref(pathname: string, allHrefs: string[]): string | null {
	const candidates = allHrefs.filter((href) => matches(pathname, href));
	if (candidates.length === 0) return null;
	return candidates.reduce((longest, href) => (href.length > longest.length ? href : longest));
}

function NavLink({ label, href, icon: Icon, active }: NavLinkItem & { active: boolean }) {
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

function NavGroup({ title, items, activeHref }: { title: string; items: NavLinkItem[]; activeHref: string | null }) {
	return (
		<div className="mb-1">
			<p className="px-6 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
				{title}
			</p>
			<div className="flex flex-col gap-0.5">
				{items.map((item) => (
					<NavLink key={item.href} {...item} active={item.href === activeHref} />
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
	const [unreadCount, setUnreadCount] = useState(0);
	const isAdmin = getUser()?.role === "ADMIN";

	useEffect(() => {
		if (!isAuthenticated()) {
			router.push("/login");
		} else {
			setIsLoading(false);
		}
	}, [router]);

	useEffect(() => {
		if (!isAuthenticated()) return;
		contactsService.getUnreadCount().then(setUnreadCount).catch(() => {});
	}, [pathname]);

	useEffect(() => {
		setSidebarOpen(false);
	}, [pathname]);

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	const experienciasItems: NavLinkItem[] = [
		{ label: "Pacotes de Viagem", href: "/dashboard/destinos", icon: MapPin },
		{ label: "Tours", href: "/dashboard/bookings", icon: CalendarCheck },
		{ label: "Configurar Tours", href: "/dashboard/excursoes", icon: Settings2 },
	];
	const hotelItems: NavLinkItem[] = [
		{ label: "Calendário", href: "/dashboard/hotel/calendario", icon: CalendarDays },
		{ label: "Reservas de Quarto", href: "/dashboard/hotel/reservas", icon: BedDouble },
		{ label: "Editar/Configurar", href: "/dashboard/hotel/configurar", icon: Settings2 },
		{ label: "Comodidades", href: "/dashboard/hotel/comodidades", icon: Sparkles },
	];
	const marketingItems: NavLinkItem[] = [
		{ label: "Vouchers e Promoções", href: "/dashboard/vouchers", icon: Ticket },
		{ label: "Publicidade e Campanhas", href: "/dashboard/campanhas", icon: Megaphone },
		// Subscritores é ADMIN-only no backend (SubscriberController) — ao contrário dos
		// outros dois itens, que AGENTE já podia gerir na Loja. Este grupo fica incondicional
		// (para não esconder Vouchers/Campanhas de AGENTE), só este item é filtrado.
		...(isAdmin ? [{ label: "Subscritores", href: "/dashboard/subscribers", icon: Mail }] : []),
	];
	const lojaItems: NavLinkItem[] = [
		{ label: "Produtos e Estoque", href: "/dashboard/loja", icon: ShoppingBag },
		{ label: "Encomendas", href: "/dashboard/loja/encomendas", icon: Truck },
		{ label: "Faturação", href: "/dashboard/faturacao", icon: Receipt },
	];
	const conteudoItems: NavLinkItem[] = [
		{ label: "Blog (Posts)", href: "/dashboard/posts", icon: Newspaper },
		{ label: "Galeria", href: "/dashboard/galeria", icon: ImageIcon },
		{ label: "Testemunhos", href: "/dashboard/testimonials", icon: Quote },
	];
	const adminItems: NavLinkItem[] = [
		{ label: "Usuários", href: "/dashboard/users", icon: Users },
		{ label: "Mensagens", href: "/dashboard/contacts", icon: Inbox },
		{ label: "Carreiras", href: "/dashboard/carreiras", icon: Briefcase },
		{ label: "Equipa", href: "/dashboard/equipa", icon: UserCog },
		{ label: "Patrocinadores", href: "/dashboard/sponsors", icon: Handshake },
		{ label: "Configurações", href: "/dashboard/settings", icon: Settings },
		{ label: "Editor de Conteúdo", href: "/dashboard/content", icon: FileEdit },
	];

	const activeHref = findActiveHref(pathname, [
		"/dashboard",
		"/dashboard/media",
		...experienciasItems.map((i) => i.href),
		...hotelItems.map((i) => i.href),
		...marketingItems.map((i) => i.href),
		...lojaItems.map((i) => i.href),
		...conteudoItems.map((i) => i.href),
		...(isAdmin ? adminItems.map((i) => i.href) : []),
	]);

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
				className={`no-print fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-white shadow-md transition-transform duration-200 ease-in-out dark:bg-gray-800 md:static md:z-auto md:flex md:translate-x-0 ${
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
						<NavLink label="Visão Geral" href="/dashboard" icon={LayoutDashboard} active={activeHref === "/dashboard"} />
						<NavLink label="Media Library" href="/dashboard/media" icon={FolderOpen} active={activeHref === "/dashboard/media"} />
					</div>

					<NavGroup title="Experiências" items={experienciasItems} activeHref={activeHref} />

					<NavGroup title="Hotel" items={hotelItems} activeHref={activeHref} />

					<NavGroup title="Marketing" items={marketingItems} activeHref={activeHref} />

					<NavGroup title="Loja" items={lojaItems} activeHref={activeHref} />

					<NavGroup title="Conteúdo" items={conteudoItems} activeHref={activeHref} />

					{isAdmin && <NavGroup title="Administração" items={adminItems} activeHref={activeHref} />}
				</nav>
			</aside>

			{/* Main Content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Topbar */}
				<header className="no-print flex items-center justify-between bg-white px-6 py-4 shadow dark:bg-gray-800">
					<button
						className="text-gray-500 focus:outline-none md:hidden"
						onClick={() => setSidebarOpen(true)}
						aria-label="Abrir menu"
					>
						<Menu size={24} />
					</button>
					<div className="flex items-center gap-1">
						<Link
							href="/dashboard/contacts"
							className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
							aria-label="Mensagens de contacto"
							title="Mensagens de contacto"
						>
							<Inbox size={20} />
							{unreadCount > 0 && (
								<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
									{unreadCount > 99 ? "99+" : unreadCount}
								</span>
							)}
						</Link>
						<NotificationBell />
					</div>

					<ProfileMenu onLogout={handleLogout} />
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 dark:bg-gray-900">
					{children}
				</main>
			</div>
		</div>
	);
}
