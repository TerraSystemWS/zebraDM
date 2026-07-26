"use client";

export default function Modal({
	title,
	onClose,
	children,
}: {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
						aria-label="Fechar"
					>
						✕
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
