"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Bell } from "lucide-react";
import { Notification, notificationsService } from "@/services/notificationsService";
import { settingsService } from "@/services/settingsService";

const MAX_LIST = 20;

// Dois tons curtos via Web Audio API — evita depender de um ficheiro de áudio no repositório.
function playChime() {
	try {
		const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		const now = ctx.currentTime;
		[880, 1174.66].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, now + i * 0.12);
			gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.12);
			osc.stop(now + i * 0.12 + 0.3);
		});
	} catch {
		// browser sem suporte a Web Audio API, ou bloqueado antes de qualquer interação — ignora
	}
}

export default function NotificationBell() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const soundEnabledRef = useRef(true);

	useEffect(() => {
		notificationsService.getAll().then(setNotifications).catch(() => {});
		notificationsService.getUnreadCount().then(setUnreadCount).catch(() => {});
		settingsService.getNotificationSoundEnabled().then((enabled) => {
			soundEnabledRef.current = enabled;
		}).catch(() => {});

		const source = notificationsService.connect((notification) => {
			setNotifications((prev) => [notification, ...prev].slice(0, MAX_LIST));
			setUnreadCount((c) => c + 1);
			if (soundEnabledRef.current) {
				playChime();
			}
			Swal.fire({
				toast: true,
				position: "top-end",
				icon: "info",
				title: notification.title,
				text: notification.body ?? undefined,
				showConfirmButton: false,
				timer: 5000,
				timerProgressBar: true,
			});
		});

		return () => source?.close();
	}, []);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleItemClick = (notification: Notification) => {
		setOpen(false);
		if (!notification.read) {
			setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
			setUnreadCount((c) => Math.max(0, c - 1));
			notificationsService.markRead(notification.id).catch(() => {});
		}
		if (notification.linkUrl) {
			router.push(notification.linkUrl);
		}
	};

	const handleMarkAllRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		setUnreadCount(0);
		notificationsService.markAllRead().catch(() => {});
	};

	return (
		<div className="relative" ref={containerRef}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
				aria-label="Notificações"
				title="Notificações"
			>
				<Bell size={20} />
				{unreadCount > 0 && (
					<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
					<div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
						<span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notificações</span>
						{unreadCount > 0 && (
							<button type="button" onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
								Marcar todas como lidas
							</button>
						)}
					</div>
					<div className="max-h-96 overflow-y-auto">
						{notifications.length === 0 ? (
							<p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Sem notificações.</p>
						) : (
							notifications.map((n) => (
								<button
									key={n.id}
									type="button"
									onClick={() => handleItemClick(n)}
									className={`block w-full border-b border-gray-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
										n.read ? "" : "bg-blue-50 dark:bg-blue-900/20"
									}`}
								>
									<div className="flex items-start gap-2">
										{!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
										<div className="min-w-0 flex-1">
											<p className="font-medium text-gray-800 dark:text-gray-100">{n.title}</p>
											{n.body && <p className="truncate text-gray-500 dark:text-gray-400">{n.body}</p>}
											<p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{new Date(n.createdAt).toLocaleString()}</p>
										</div>
									</div>
								</button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
