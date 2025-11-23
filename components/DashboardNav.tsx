import Image from "next/image";

export default function DashboardNav() {
  return (
    <div className="flex h-[60px] w-full items-center justify-between px-4">
      {/* Juby Logo */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#424de7]">
        <Image
          src="/logo/logo/square blue.png"
          alt="Juby"
          width={44}
          height={44}
          className="object-contain"
        />
      </div>

      {/* Menu button */}
      <button className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-gray-100 rounded-xl">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6H20"
            stroke="#424de7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M4 12H20"
            stroke="#424de7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M4 18H20"
            stroke="#424de7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
