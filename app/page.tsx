"use client";
import { walletAuth } from "@/lib/auth/wallet";
import WorldIdMockModal from "@/components/WorldIdMockModal";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const IS_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export default function Login() {
	const [isPending, setIsPending] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { isInstalled } = useMiniKit();
	const router = useRouter();

	// Real auth flow
	const handleRealAuth = useCallback(async () => {
		if (!isInstalled || isPending) return;
		setIsPending(true);
		try {
			await walletAuth();
		} catch (error) {
			console.error("World authentication error", error);
			setIsPending(false);
		}
	}, [isInstalled, isPending]);

	// Mock auth flow
	const handleMockAuth = () => {
		setIsModalOpen(true);
	};

	const handleMockSuccess = () => {
		setIsModalOpen(false);
		router.push("/dashboard"); // Change to your target route
	};

	// Choose handler based on mode
	const handleAuth = IS_MOCK_MODE ? handleMockAuth : handleRealAuth;

	return (
		<div className="relative min-h-screen w-full overflow-hidden bg-[#424de7]">
			{/* Dotted pattern overlay */}
			<div
				className="absolute inset-0 opacity-20"
				style={{
					backgroundImage:
						"radial-gradient(circle, rgba(255,255,255,0.5) 2.5px, transparent 2.5px)",
					backgroundSize: "24px 24px",
				}}
			/>

			{/* Background overlay SVG */}
			<div className="absolute inset-0 opacity-15 mix-blend-overlay">
				<Image
					src="/assets/login-background.svg"
					alt=""
					fill
					className="object-cover"
					priority
				/>
			</div>

			{/* Logo and Brand at top */}
			<div className="absolute left-1/2 top-[80px] flex -translate-x-1/2 items-center justify-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
					<Image
						src="/logo/logo/square white.png"
						alt="Juby"
						width={44}
						height={44}
						className="object-contain"
					/>
				</div>
				<p className="font-manrope text-[24px] font-extrabold tracking-[-0.48px] text-white">
					Juby
				</p>
			</div>

			{/* Center animation */}
			<div className="absolute left-1/2 top-[200px] h-[200px] w-[200px] -translate-x-1/2">
				<video
					autoPlay
					loop
					muted
					playsInline
					className="h-full w-full object-cover"
				>
					<source
						src="/assets/analitica-login-animation.mp4"
						type="video/mp4"
					/>
				</video>
			</div>

			{/* Bottom content - text and button */}
			<div className="absolute bottom-[80px] left-1/2 flex w-[305px] -translate-x-1/2 flex-col items-center gap-3">
				{/* Welcome text */}
				<p className="font-manrope text-[16px] font-semibold tracking-[-0.32px] text-white opacity-80">
					Welcome to Juby
				</p>

				{/* Main heading */}
				<div className="flex w-full flex-col text-center">
					<h1 className="font-manrope text-[30px] font-extrabold leading-[33px] tracking-[-1.2px] text-white">
						Construyendo tu
					</h1>
					<h1 className="font-manrope text-[30px] font-extrabold leading-[33px] tracking-[-1.2px] text-white">
						identidad financiera
					</h1>
				</div>

				{/* Subtitle */}
				<p className="w-full text-center font-manrope text-[13px] font-semibold leading-[18px] tracking-[-0.26px] text-white opacity-70">
					Verifica tu humanidad una sola vez para crear tu historial de ahorro
					transparente.
				</p>

				{/* Button */}
				<button
					onClick={handleAuth}
					disabled={isPending || (!IS_MOCK_MODE && !isInstalled)}
					className="relative mt-2 inline-block disabled:opacity-50"
				>
					<div className="relative h-[48px] w-[232px] overflow-hidden rounded-[22.5px]">
						{/* Gradient background */}
						<div className="absolute inset-0 bg-linear-to-r from-[#2a75ff] to-[#8ac7ff]" />

						{/* Button content - centered */}
						<div className="absolute inset-0 flex items-center justify-center gap-2">
							{/* Worldcoin logo */}
							<div className="h-[23px] w-[23px]">
								<Image
									src="/assets/worldcoin-logo.png"
									alt="Worldcoin"
									width={23}
									height={23}
									className="object-cover"
								/>
							</div>

							{/* Button text */}
							<span className="whitespace-nowrap font-manrope text-[14px] font-extrabold tracking-[-0.28px] text-white">
								{isPending ? "Verificando..." : "Verificar con World ID"}
							</span>
						</div>
					</div>
				</button>
			</div>

			{/* Mock Modal - only renders in mock mode */}
			{IS_MOCK_MODE && (
				<WorldIdMockModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					onSuccess={handleMockSuccess}
				/>
			)}
		</div>
	);
}
