"use client";

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div
      className="rounded-[var(--radius-card)] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4"
      role="alert"
    >
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry loading data"
          className="mt-3 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline underline-offset-2 transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 rounded"
        >
          Retry
        </button>
      )}
    </div>
  );
}
