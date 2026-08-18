"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";

// Fallback é a site key de teste da Cloudflare (sempre passa, sem conta) — garante que
// `npm run dev` funciona de imediato mesmo sem .env.local configurado.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

declare global {
	interface Window {
		turnstile?: {
			render: (
				container: HTMLElement,
				options: {
					sitekey: string;
					callback: (token: string) => void;
					"expired-callback"?: () => void;
					"error-callback"?: () => void;
					theme?: "auto" | "light" | "dark";
				}
			) => string;
			reset: (widgetId?: string) => void;
		};
	}
}

export interface TurnstileHandle {
	reset: () => void;
}

interface TurnstileProps {
	onVerify: (token: string) => void;
}

// Widget Cloudflare Turnstile, sem dependência npm extra (script oficial + window.turnstile).
// Um token só pode ser verificado uma vez pelo backend — o formulário pai deve chamar reset()
// depois de cada tentativa de submissão (sucesso ou erro), senão a submissão seguinte falha sempre.
const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile({ onVerify }, ref) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | undefined>(undefined);
	const [scriptLoaded, setScriptLoaded] = useState(false);

	useImperativeHandle(ref, () => ({
		reset: () => {
			if (window.turnstile && widgetIdRef.current) {
				window.turnstile.reset(widgetIdRef.current);
			}
		},
	}));

	useEffect(() => {
		if (!scriptLoaded || !window.turnstile || !containerRef.current || widgetIdRef.current) return;
		widgetIdRef.current = window.turnstile.render(containerRef.current, {
			sitekey: SITE_KEY,
			callback: onVerify,
			theme: "auto",
		});
	}, [scriptLoaded, onVerify]);

	return (
		<>
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js"
				strategy="afterInteractive"
				onReady={() => setScriptLoaded(true)}
			/>
			<div ref={containerRef} />
		</>
	);
});

export default Turnstile;
