"use client";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-700 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-[var(--transition-fast)] pointer-events-none whitespace-nowrap z-50 shadow-lg"
      >
        {content}
      </span>
    </div>
  );
}
