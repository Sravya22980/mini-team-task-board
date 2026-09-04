import type { ColumnVariant } from "@/lib/columnTheme";

function ClipboardArt({ variant }: { variant: ColumnVariant }) {
  return (
    <svg viewBox="0 0 120 88" className="mx-auto h-20 w-28" aria-hidden>
      <ellipse cx="88" cy="72" rx="18" ry="6" fill="#EDE9FE" />
      <path d="M82 72c0-10 6-18 10-22 2 8 8 14 12 16-8 2-16 4-22 6z" fill="#C4B5FD" />
      <rect x="36" y="10" width="48" height="62" rx="8" fill="#F5F3FF" stroke="#DDD6FE" />
      <rect x="48" y="6" width="24" height="10" rx="5" fill="#A78BFA" />
      {variant === "done" ? (
        <path
          d="M52 42l8 8 16-16"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <rect x="48" y="28" width="24" height="3" rx="1.5" fill="#DDD6FE" />
          <rect x="48" y="36" width="24" height="3" rx="1.5" fill="#DDD6FE" />
          <rect x="48" y="44" width="16" height="3" rx="1.5" fill="#DDD6FE" />
        </>
      )}
    </svg>
  );
}

export default function ColumnEmptyState({
  variant,
  title,
  subtitle,
}: {
  variant: ColumnVariant;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <ClipboardArt variant={variant} />
      <p className="mt-3 text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}