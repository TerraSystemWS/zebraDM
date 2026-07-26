import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "ZebraDash - Painel Administrativo",
	description: "Painel Administrativo da Zebra Travel",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt">
			<body>{children}</body>
		</html>
	);
}
