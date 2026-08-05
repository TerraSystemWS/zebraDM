
export default function DashboardPage() {
	return (
		<div>
			<h2 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">
				Visão Geral
			</h2>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
						Total de Reservas
					</h3>
					<p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
						1,234
					</p>
				</div>
				<div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
						Usuários Ativos
					</h3>
					<p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
						567
					</p>
				</div>
				<div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
						Receita Mensal
					</h3>
					<p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
						R$ 45.000
					</p>
				</div>
				<div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
						Feedback
					</h3>
					<p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
						4.8/5
					</p>
				</div>
			</div>

			<div className="mt-8">
				<h3 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">Atividades Recentes</h3>
				<div className="bg-white shadow-md rounded-lg overflow-x-auto dark:bg-gray-800">
					<table className="min-w-full leading-normal">
						<thead>
							<tr>
								<th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
									Usuário
								</th>
								<th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
									Ação
								</th>
								<th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
									Data
								</th>
								<th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
									Status
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="px-5 py-5 border-b border-gray-200 bg-white text-sm dark:bg-gray-800 dark:border-gray-700">
									<div className="flex items-center">
										<div className="ml-3">
											<p className="text-gray-900 whitespace-no-wrap dark:text-white">
												João Silva
											</p>
										</div>
									</div>
								</td>
								<td className="px-5 py-5 border-b border-gray-200 bg-white text-sm dark:bg-gray-800 dark:border-gray-700">
									<p className="text-gray-900 whitespace-no-wrap dark:text-white">Reserva Confirmada</p>
								</td>
								<td className="px-5 py-5 border-b border-gray-200 bg-white text-sm dark:bg-gray-800 dark:border-gray-700">
									<p className="text-gray-900 whitespace-no-wrap dark:text-white">
										12/02/2026
									</p>
								</td>
								<td className="px-5 py-5 border-b border-gray-200 bg-white text-sm dark:bg-gray-800 dark:border-gray-700">
									<span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
										<span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
										<span className="relative">Concluído</span>
									</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
