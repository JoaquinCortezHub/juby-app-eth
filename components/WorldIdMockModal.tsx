"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

interface WorldIdMockModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function WorldIdMockModal({
	isOpen,
	onClose,
	onSuccess,
}: WorldIdMockModalProps) {
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [keepSignedIn, setKeepSignedIn] = useState(true);

	useEffect(() => {
		if (!isOpen) {
			setIsSigningIn(false);
			setIsSuccess(false);
		}
	}, [isOpen]);

	const handleSignIn = async () => {
		setIsSigningIn(true);
		await new Promise((r) => setTimeout(r, 1500));
		setIsSigningIn(false);
		setIsSuccess(true);
		await new Promise((r) => setTimeout(r, 1200));
		onSuccess();
	};

	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0 z-40 bg-black/50 transition-opacity"
				onClick={onClose}
			/>

			<div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
				<div className="mx-auto max-w-md rounded-t-[32px] bg-white px-6 pb-10 pt-6">
					<div className="flex items-start justify-between">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4285f4]">
							<Image
								src="/logo/logo/square white.png"
								alt="Juby"
								width={32}
								height={32}
								className="object-contain"
							/>
						</div>

						<button
							onClick={onClose}
							className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						</button>
					</div>

					<div className="mt-5">
						<h2 className="text-[28px] font-bold text-gray-900">Sign In</h2>
						<div className="flex items-center gap-1.5">
							<span className="text-[17px] text-gray-600">to Juby</span>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="#4285f4">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
							</svg>
						</div>
					</div>

					<p className="mt-4 text-[15px] leading-relaxed text-gray-500">
						Sign to confirm wallet ownership and authenticate to Juby.
					</p>

					<div className="my-5 h-px bg-gray-200" />

					<div>
						<p className="text-[15px] text-gray-500">This app will see your</p>
						<div className="mt-3 space-y-2.5">
							{["Wallet", "Verification level"].map((item) => (
								<div key={item} className="flex items-center gap-3">
									<div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4285f4]">
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="white"
										>
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
										</svg>
									</div>
									<span className="text-[16px] font-medium text-gray-900">
										{item}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className="mt-6 flex items-center gap-3">
						<button
							onClick={() => setKeepSignedIn(!keepSignedIn)}
							className={`relative h-7 w-12 rounded-full transition-colors ${
								keepSignedIn ? "bg-gray-800" : "bg-gray-300"
							}`}
						>
							<div
								className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
									keepSignedIn ? "left-6" : "left-1"
								}`}
							/>
						</button>
						<span className="text-[15px] text-gray-500">
							Keep me signed in for future sessions
						</span>
					</div>

					<div className="mt-8">
						{isSuccess ? (
							<div className="flex items-center justify-center gap-2 py-3">
								<div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="white">
										<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
									</svg>
								</div>
								<span className="text-[17px] font-semibold text-green-500">
									Signed in
								</span>
							</div>
						) : (
							<button
								onClick={handleSignIn}
								disabled={isSigningIn}
								className="w-full rounded-full bg-gray-900 py-4 text-[17px] font-semibold text-white transition-opacity disabled:opacity-70"
							>
								{isSigningIn ? "Signing in..." : "Sign In"}
							</button>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
