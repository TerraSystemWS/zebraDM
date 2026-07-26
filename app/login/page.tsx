"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, isAuthenticated } from "@/lib/auth";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		if (isAuthenticated()) {
			router.push("/dashboard");
		}
	}, [router]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await login(email, password);
			router.push("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Credenciais inválidas");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
				<div className="mb-6 flex justify-center">
					<h1 className="text-3xl font-bold text-gray-800 dark:text-white">
						ZebraDash
					</h1>
				</div>
				<h2 className="mb-6 text-center text-2xl font-semibold text-gray-700 dark:text-gray-200">
					Login Dashboard
				</h2>
				{error && (
					<div className="mb-4 rounded bg-red-100 px-4 py-2 text-sm text-red-700">
						{error}
					</div>
				)}
				<form onSubmit={handleLogin}>
					<div className="mb-4">
						<label
							className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
							htmlFor="email"
						>
							Email
						</label>
						<input
							className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							id="email"
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="mb-6">
						<label
							className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
							htmlFor="password"
						>
							Senha
						</label>
						<input
							className="focus:shadow-outline mb-3 w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							id="password"
							type="password"
							placeholder="******************"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<div className="flex items-center justify-between">
						<button
							className="focus:shadow-outline w-full rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
							type="submit"
							disabled={loading}
						>
							{loading ? "A entrar..." : "Entrar"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
