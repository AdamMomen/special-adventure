"use client";

interface HomeIconProps {
  className?: string;
}

export function HomeIcon({ className = "w-20 h-20" }: HomeIconProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect
        width="80"
        height="80"
        rx="16"
        fill="url(#home-icon-gradient)"
        className="text-violet-500"
      />
      <path
        d="M16 56V32l12 12 18-24 18 12 12-6"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="home-icon-gradient"
          x1="0"
          y1="0"
          x2="80"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}
