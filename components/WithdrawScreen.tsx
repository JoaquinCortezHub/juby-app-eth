"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, AlertCircle, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { MiniKit } from "@worldcoin/minikit-js";
import { CONTRACTS, fromUSDC } from "@/lib/contracts/addresses";
import { JUBY_VAULT_ABI } from "@/lib/contracts/abis";

interface UserDepositInfo {
	principal: number;
	currentValue: number;
	yield: number;
	goalDate: Date;
	isEarly: boolean;
	potentialPenalty: number;
}

export default function WithdrawScreen() {
	const [depositInfo, setDepositInfo] = useState<UserDepositInfo | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [transactionStatus, setTransactionStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

	const router = useRouter();

	// TODO: Replace with actual user address from wallet
	const userAddress = "0x0000000000000000000000000000000000000000";

	useEffect(() => {
		loadDepositInfo();
	}, []);

	const loadDepositInfo = async () => {
		try {
			setIsLoading(true);

			// TODO: Call getUserInfo from contract
			// For now, mock data
			const mockInfo: UserDepositInfo = {
				principal: 1000,
				currentValue: 1045.2,
				yield: 45.2,
				goalDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
				isEarly: true,
				potentialPenalty: 22.6, // 50% of yield
			};

			setDepositInfo(mockInfo);
		} catch (error) {
			console.error("Error loading deposit info:", error);
			setErrorMessage("Error loading your deposit information");
		} finally {
			setIsLoading(false);
		}
	};

	const handleWithdraw = async () => {
		if (!depositInfo || isWithdrawing) return;

		try {
			setIsWithdrawing(true);
			setTransactionStatus("processing");
			setErrorMessage("");

			const withdrawResult = await MiniKit.commandsAsync.sendTransaction({
				transaction: [
					{
						address: CONTRACTS.JUBY_VAULT,
						abi: JUBY_VAULT_ABI,
						functionName: "withdraw",
						args: [],
					},
				],
			});

			if (withdrawResult?.finalPayload?.status === "error") {
				throw new Error("Withdrawal failed");
			}

			setTransactionStatus("success");

			// Navigate back to dashboard after successful withdrawal
			setTimeout(() => {
				router.push("/dashboard");
			}, 2000);
		} catch (error) {
			console.error("Withdrawal error:", error);
			setTransactionStatus("error");
			setErrorMessage(
				error instanceof Error ? error.message : "Withdrawal failed. Please try again."
			);
		} finally {
			setIsWithdrawing(false);
		}
	};

	const userWillReceive = depositInfo
		? depositInfo.currentValue - depositInfo.potentialPenalty
		: 0;

	if (isLoading) {
		return (
			<div className="min-h-screen bg-linear-to-b from-sky-50 to-blue-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-gray-600">Cargando información...</p>
				</div>
			</div>
		);
	}

	if (!depositInfo) {
		return (
			<div className="min-h-screen bg-linear-to-b from-sky-50 to-blue-50 flex items-center justify-center px-6">
				<div className="text-center max-w-sm">
					<AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h2 className="text-xl font-bold text-gray-800 mb-2">
						No tienes depósitos activos
					</h2>
					<p className="text-gray-600 mb-6">
						Realiza tu primer depósito para empezar a generar ganancias
					</p>
					<button
						onClick={() => router.push("/invest")}
						className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
					>
						Ir a Invertir
					</button>
				</div>
			</div>
		);
	}

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("es-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
		}).format(amount);
	};

	return (
		<div className="min-h-screen bg-linear-to-b from-sky-50 to-blue-50">
			{/* Header */}
			<header className="flex items-center p-4">
				<button
					onClick={() => router.push("/dashboard")}
					className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
				>
					<ChevronLeft className="w-5 h-5 text-blue-500" />
				</button>
				<h1 className="flex-1 text-center text-lg font-bold text-gray-800 mr-10">
					Retirar Fondos
				</h1>
			</header>

			{/* Main Content */}
			<main className="px-6 pt-6 pb-8">
				{/* Current Value Card */}
				<div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
					<p className="text-sm text-gray-500 mb-2">Valor actual de tu inversión</p>
					<h2 className="text-4xl font-bold text-gray-800 mb-4">
						{formatCurrency(depositInfo.currentValue)}
					</h2>

					{/* Investment Details */}
					<div className="space-y-3 border-t border-gray-100 pt-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<DollarSign className="w-4 h-4 text-gray-400" />
								<span className="text-sm text-gray-600">Principal</span>
							</div>
							<span className="font-semibold text-gray-800">
								{formatCurrency(depositInfo.principal)}
							</span>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<TrendingUp className="w-4 h-4 text-green-500" />
								<span className="text-sm text-gray-600">Ganancias</span>
							</div>
							<span className="font-semibold text-green-600">
								+{formatCurrency(depositInfo.yield)}
							</span>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-gray-400" />
								<span className="text-sm text-gray-600">Fecha objetivo</span>
							</div>
							<span className="font-semibold text-gray-800">
								{formatDate(depositInfo.goalDate)}
							</span>
						</div>
					</div>
				</div>

				{/* Early Withdrawal Warning */}
				{depositInfo.isEarly && depositInfo.potentialPenalty > 0 && (
					<div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6">
						<div className="flex items-start gap-3">
							<AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
							<div className="flex-1">
								<h3 className="font-bold text-amber-900 mb-2">
									Retiro anticipado
								</h3>
								<p className="text-sm text-amber-800 mb-3">
									Estás retirando antes de tu fecha objetivo. Juby se quedará con el
									50% de tus ganancias.
								</p>

								{/* Penalty Breakdown */}
								<div className="bg-white rounded-lg p-3 space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">Valor total</span>
										<span className="font-semibold text-gray-800">
											{formatCurrency(depositInfo.currentValue)}
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-amber-700">Penalización (50%)</span>
										<span className="font-semibold text-amber-700">
											-{formatCurrency(depositInfo.potentialPenalty)}
										</span>
									</div>
									<div className="flex justify-between text-base border-t border-gray-200 pt-2">
										<span className="font-bold text-gray-800">Recibirás</span>
										<span className="font-bold text-blue-600">
											{formatCurrency(userWillReceive)}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* No Penalty - On Time */}
				{!depositInfo.isEarly && (
					<div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 mb-6">
						<div className="flex items-start gap-3">
							<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
								<svg
									className="w-4 h-4 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-bold text-green-900 mb-1">
									¡Felicitaciones!
								</h3>
								<p className="text-sm text-green-800">
									Alcanzaste tu meta. Recibirás el 100% de tus fondos incluyendo
									todas las ganancias.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Error Message */}
				{errorMessage && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<p className="text-sm text-red-700 text-center">{errorMessage}</p>
					</div>
				)}

				{/* Transaction Status */}
				{transactionStatus === "processing" && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
						<div className="flex items-center justify-center gap-3">
							<div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
							<p className="text-sm text-blue-700">Procesando retiro...</p>
						</div>
					</div>
				)}

				{transactionStatus === "success" && (
					<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
						<p className="text-sm text-green-700 text-center font-semibold">
							¡Retiro exitoso! Redirigiendo...
						</p>
					</div>
				)}
			</main>

			{/* Footer - Withdraw Button */}
			<footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
				<button
					onClick={() => setShowConfirmation(true)}
					disabled={isWithdrawing}
					className={`w-full py-4 text-white font-semibold rounded-full shadow-lg transition-all ${
						isWithdrawing
							? "bg-gray-400 cursor-not-allowed"
							: "bg-red-500 hover:bg-red-600 hover:shadow-xl"
					}`}
				>
					{isWithdrawing ? "Procesando..." : "Confirmar Retiro"}
				</button>
			</footer>

			{/* Confirmation Modal */}
			{showConfirmation && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
					<div className="bg-white rounded-2xl p-6 max-w-sm w-full">
						<h3 className="text-xl font-bold text-gray-800 mb-3">
							¿Confirmar retiro?
						</h3>
						<p className="text-gray-600 mb-6">
							{depositInfo.isEarly
								? `Recibirás ${formatCurrency(userWillReceive)} después de la penalización.`
								: `Recibirás ${formatCurrency(depositInfo.currentValue)} en tu cuenta.`}
						</p>

						<div className="flex gap-3">
							<button
								onClick={() => setShowConfirmation(false)}
								className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={() => {
									setShowConfirmation(false);
									handleWithdraw();
								}}
								className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-colors"
							>
								Confirmar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
